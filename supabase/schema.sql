-- PartShare Schema  (v2 - reviewed)
-- Safe to run on a brand-new Supabase project AND on top of the v1 file: everything is idempotent.
-- Every change from v1 is marked with a "FIX" comment.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. TYPES
DO $$ BEGIN
    CREATE TYPE post_type AS ENUM ('offer', 'request');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE post_category AS ENUM ('motors_actuators', 'boards_controllers', 'sensors', 'drivers_modules', 'power_batteries', 'mechanical', 'wheels_gears_chassis', 'cables_connectors', 'tools_equipment', 'other');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE item_condition AS ENUM ('new', 'like_new', 'used_working', 'untested', 'for_parts');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE share_mode AS ENUM ('give', 'lend', 'swap');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE post_status AS ENUM ('open', 'done', 'hidden');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. TABLES

CREATE TABLE IF NOT EXISTS app_settings (
    key text PRIMARY KEY,
    value jsonb NOT NULL
);

INSERT INTO app_settings (key, value) VALUES 
('allowed_email_domains', '[]'::jsonb),
('post_expiry_days', '60'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE TABLE IF NOT EXISTS profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name text NOT NULL CHECK (length(display_name) between 2 and 50),
    whatsapp text NOT NULL CHECK (whatsapp ~ '^\d{8,15}$'),
    location text NOT NULL CHECK (length(location) between 1 and 80),
    consent_at timestamptz NOT NULL DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS posts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type post_type NOT NULL,
    title text NOT NULL CHECK (length(title) between 3 and 80),
    category post_category NOT NULL,
    model_number text CHECK (length(model_number) <= 60),
    model_key text GENERATED ALWAYS AS (regexp_replace(upper(coalesce(model_number,'')), '[^A-Z0-9]', '', 'g')) STORED,
    quantity int NOT NULL DEFAULT 1 CHECK (quantity between 1 and 999),
    condition item_condition,
    details text CHECK (length(details) <= 500),
    -- FIX: array_length('{}',1) is NULL and a NULL check passes, so empty arrays were accepted; cardinality() fixes that
    share_modes share_mode[] NOT NULL CONSTRAINT posts_share_modes_check CHECK (cardinality(share_modes) >= 1),
    location text NOT NULL CHECK (length(location) between 1 and 80),
    needed_by date,
    status post_status NOT NULL DEFAULT 'open',
    report_count int NOT NULL DEFAULT 0,
    author_name text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL DEFAULT (now() + interval '60 days'),
    CONSTRAINT chk_condition_offer CHECK (type != 'offer' OR condition IS NOT NULL),
    CONSTRAINT chk_needed_by_request CHECK (type = 'request' OR needed_by IS NULL)
);

CREATE TABLE IF NOT EXISTS reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason text NOT NULL CHECK (length(reason) between 1 and 500),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(post_id, reporter_id)
);

CREATE TABLE IF NOT EXISTS contact_reveals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_posts_type_status_expires ON posts(type, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_model_key ON posts(model_key) WHERE model_key != '';
CREATE INDEX IF NOT EXISTS idx_posts_fts ON posts USING GIN (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(model_number,'') || ' ' || coalesce(details,'')));
CREATE INDEX IF NOT EXISTS idx_posts_title_trgm ON posts USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_user_id_created_at ON contact_reveals(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contact_reveals_post_id ON contact_reveals(post_id);

-- FIX (upgrade path only): databases created from v1 still have the old, leaky share_modes check.
DO $$ BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.posts'::regclass AND conname = 'posts_share_modes_check'
          AND pg_get_constraintdef(oid) ILIKE '%array_length%'
    ) THEN
        ALTER TABLE posts DROP CONSTRAINT posts_share_modes_check;
        ALTER TABLE posts ADD CONSTRAINT posts_share_modes_check CHECK (cardinality(share_modes) >= 1) NOT VALID;
    END IF;
END $$;

-- 5. HELPER FUNCTIONS

-- FIX: RLS policy expressions run with the privileges of the CALLING user, and app_settings is (correctly) locked
-- down by RLS: no policies means no client can read it. So the v1 profiles_insert policy could never read the
-- setting and rejected EVERY new profile. Reading it inside a SECURITY DEFINER function avoids that problem.
CREATE OR REPLACE FUNCTION is_domain_allowed()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
    SELECT
        COALESCE((SELECT value = '[]'::jsonb FROM app_settings WHERE key = 'allowed_email_domains'), true)
        OR EXISTS (
            SELECT 1
            FROM app_settings s, jsonb_array_elements_text(s.value) AS d
            WHERE s.key = 'allowed_email_domains'
              AND lower(d) = lower(split_part(coalesce(auth.jwt()->>'email', ''), '@', 2))
        );
$$;

CREATE OR REPLACE FUNCTION is_member()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public
AS $$
    SELECT auth.uid() IS NOT NULL
       AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND consent_at IS NOT NULL)
       AND is_domain_allowed();
$$;

-- 6. RLS POLICIES
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_reveals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS profiles_select ON profiles;
    DROP POLICY IF EXISTS profiles_insert ON profiles;
    DROP POLICY IF EXISTS profiles_update ON profiles;
    DROP POLICY IF EXISTS profiles_delete ON profiles;
    
    DROP POLICY IF EXISTS posts_select_anon ON posts;
    DROP POLICY IF EXISTS posts_select_owner ON posts;
    DROP POLICY IF EXISTS posts_insert ON posts;
    DROP POLICY IF EXISTS posts_update ON posts;
    DROP POLICY IF EXISTS posts_delete ON posts;
    
    DROP POLICY IF EXISTS reports_insert ON reports;
    DROP POLICY IF EXISTS reports_select ON reports;
END $$;

CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
-- FIX: use is_domain_allowed() (see section 5) instead of reading app_settings directly inside the policy
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id AND is_domain_allowed());
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_delete ON profiles FOR DELETE USING (auth.uid() = id);

CREATE POLICY posts_select_anon ON posts FOR SELECT USING (status = 'open' AND expires_at > now());
CREATE POLICY posts_select_owner ON posts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY posts_insert ON posts FOR INSERT WITH CHECK (is_member() AND auth.uid() = user_id);
CREATE POLICY posts_update ON posts FOR UPDATE USING (is_member() AND auth.uid() = user_id);
CREATE POLICY posts_delete ON posts FOR DELETE USING (is_member() AND auth.uid() = user_id);

-- FIX: no INSERT policy on reports. Reports must go through report_post(), which blocks reporting your own post
-- and keeps report_count / auto-hide in sync. (v1 allowed direct inserts that bypassed all of that.)

-- 7. TRIGGERS
-- (All trigger functions are SECURITY DEFINER with a fixed search_path so they behave the same for every caller.)
-- "Signed-in user" below means auth.uid() IS NOT NULL. The Supabase dashboard / SQL editor has no JWT, so
-- moderation done there is never blocked by these guards.

-- a) sync_author_name
CREATE OR REPLACE FUNCTION fn_sync_author_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE posts SET author_name = NEW.display_name WHERE user_id = NEW.id AND author_name IS DISTINCT FROM NEW.display_name;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_author_name ON profiles;
CREATE TRIGGER trg_sync_author_name
AFTER INSERT OR UPDATE OF display_name ON profiles
FOR EACH ROW EXECUTE FUNCTION fn_sync_author_name();

-- b) set_author_name_on_post_insert
CREATE OR REPLACE FUNCTION fn_set_author_name() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    NEW.author_name := COALESCE((SELECT display_name FROM profiles WHERE id = NEW.user_id), NEW.author_name);
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_set_author_name_on_post_insert ON posts;
CREATE TRIGGER trg_set_author_name_on_post_insert
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION fn_set_author_name();

-- c) enforce_max_open_posts
-- FIX: v1 counted every post with status 'open', including EXPIRED ones (expiry is computed from expires_at and
-- never changes status). After 60 days a user's old listings would still count toward the limit of 30 and lock them out.
CREATE OR REPLACE FUNCTION fn_enforce_max_open_posts() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    open_count int;
BEGIN
    SELECT count(*) INTO open_count FROM posts
    WHERE user_id = NEW.user_id AND status = 'open' AND expires_at > now();
    IF open_count >= 30 THEN
        RAISE EXCEPTION 'Maximum limit of 30 open posts reached.';
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_enforce_max_open_posts ON posts;
CREATE TRIGGER trg_enforce_max_open_posts
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION fn_enforce_max_open_posts();

-- d) post_insert_guard   (NEW)
-- FIX: v1 let the browser set status, report_count, created_at and expires_at on insert, so anyone could create a
-- listing that never expires, pin itself to the top of "newest", or start life pre-reported. The server now decides.
-- It also finally uses the post_expiry_days setting (v1 hard-coded 60).
CREATE OR REPLACE FUNCTION fn_post_insert_guard() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_days int;
BEGIN
    IF auth.uid() IS NOT NULL THEN
        v_days := COALESCE((SELECT (value #>> '{}')::int FROM app_settings WHERE key = 'post_expiry_days'), 60);
        NEW.status       := 'open';
        NEW.report_count := 0;
        NEW.created_at   := now();
        NEW.expires_at   := now() + make_interval(days => v_days);
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_post_insert_guard ON posts;
CREATE TRIGGER trg_post_insert_guard
BEFORE INSERT ON posts
FOR EACH ROW EXECUTE FUNCTION fn_post_insert_guard();

-- e) protect_post_fields
-- FIX 1: v1 blocked EVERYONE (including you, in the dashboard) from un-hiding a post, so a falsely reported listing
--        could never be restored without disabling the trigger. Now only the post's owner is blocked.
-- FIX 2: owners could rewrite created_at, author_name (impersonation) and push expires_at decades ahead.
--        Now created_at is frozen, author_name always follows the profile, and expires_at can be shortened or
--        renewed but never pushed beyond post_expiry_days from now.
CREATE OR REPLACE FUNCTION fn_protect_post_fields() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_days int;
BEGIN
    IF NEW.user_id != OLD.user_id THEN
        RAISE EXCEPTION 'Cannot change post owner';
    END IF;

    IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
        IF NEW.report_count != OLD.report_count THEN
            RAISE EXCEPTION 'Cannot modify report count';
        END IF;
        IF OLD.status = 'hidden' AND NEW.status != 'hidden' THEN
            RAISE EXCEPTION 'Cannot unhide a hidden post';
        END IF;

        v_days := COALESCE((SELECT (value #>> '{}')::int FROM app_settings WHERE key = 'post_expiry_days'), 60);
        NEW.created_at  := OLD.created_at;
        NEW.expires_at  := LEAST(NEW.expires_at, now() + make_interval(days => v_days));
        NEW.author_name := COALESCE((SELECT display_name FROM profiles WHERE id = OLD.user_id), OLD.author_name);
    END IF;

    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_protect_post_fields ON posts;
CREATE TRIGGER trg_protect_post_fields
BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION fn_protect_post_fields();

-- 8. RPC FUNCTIONS

-- reveal_contact
-- FIX: v1 logged and counted EVERY tap, so tapping the same listing three times looked like three interested people
--      and used up three of the 60 daily reveals. Now a repeat tap on the same post within 24h is free and not logged,
--      and the daily limit counts distinct posts. Also refuses cleanly if the poster has no profile any more.
CREATE OR REPLACE FUNCTION reveal_contact(p_post_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post posts%ROWTYPE;
    v_profile profiles%ROWTYPE;
    v_reveal_count int;
BEGIN
    IF NOT is_member() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;

    SELECT * INTO v_post FROM posts
    WHERE id = p_post_id AND status = 'open' AND expires_at > now();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not available';
    END IF;

    IF v_post.user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot contact yourself';
    END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = v_post.user_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contact unavailable';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM contact_reveals
        WHERE user_id = auth.uid() AND post_id = p_post_id AND created_at > now() - interval '24 hours'
    ) THEN
        SELECT count(DISTINCT post_id) INTO v_reveal_count FROM contact_reveals
        WHERE user_id = auth.uid() AND created_at > now() - interval '24 hours';

        IF v_reveal_count >= 60 THEN
            RAISE EXCEPTION 'Rate limit exceeded';
        END IF;

        INSERT INTO contact_reveals (user_id, post_id) VALUES (auth.uid(), p_post_id);
    END IF;

    RETURN jsonb_build_object('name', v_profile.display_name, 'whatsapp', v_profile.whatsapp);
END;
$$;

-- match_posts
-- FIX 1: v1 stripped characters BEFORE upper-casing (regexp_replace(..., '[^A-Z0-9]') on the raw input), which deleted
--        every lower-case letter: typing "l298n" produced the key "298" and never matched. Upper-case first.
-- FIX 2: search_path now includes "extensions" so similarity() is found even when pg_trgm was enabled from the
--        Supabase dashboard (that installs it in the "extensions" schema, not "public").
CREATE OR REPLACE FUNCTION match_posts(
    p_for_type post_type,
    p_title text,
    p_model text DEFAULT NULL,
    p_category post_category DEFAULT NULL,
    p_exclude_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    type post_type,
    title text,
    category post_category,
    model_number text,
    model_key text,
    quantity int,
    location text,
    author_name text,
    created_at timestamptz,
    share_modes share_mode[],
    condition item_condition,
    needed_by date,
    similarity real
)
LANGUAGE sql
SECURITY DEFINER STABLE
SET search_path = public, extensions
AS $$
    WITH input AS (
        SELECT regexp_replace(upper(coalesce(p_model,'')), '[^A-Z0-9]', '', 'g') AS mk
    )
    SELECT
        p.id, p.type, p.title, p.category, p.model_number, p.model_key,
        p.quantity, p.location, p.author_name, p.created_at, p.share_modes,
        p.condition, p.needed_by,
        (
            CASE
                WHEN input.mk != '' AND p.model_key = input.mk THEN 2.0
                ELSE 0.0
            END +
            CASE
                WHEN p.category = p_category THEN similarity(p.title, p_title)
                ELSE 0.0
            END
        )::real AS sim
    FROM posts p, input
    WHERE p.type = CASE WHEN p_for_type = 'offer' THEN 'request'::post_type ELSE 'offer'::post_type END
      AND p.status = 'open'
      AND p.expires_at > now()
      AND (p_exclude_id IS NULL OR p.id != p_exclude_id)
      AND (auth.uid() IS NULL OR p.user_id != auth.uid())
      AND (
          (input.mk != '' AND p.model_key = input.mk) OR
          (p.category = p_category AND similarity(p.title, p_title) > 0.1)
      )
    ORDER BY sim DESC
    LIMIT 10;
$$;

-- report_post
CREATE OR REPLACE FUNCTION report_post(p_post_id uuid, p_reason text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post posts%ROWTYPE;
    v_report_count int;
BEGIN
    IF NOT is_member() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    
    SELECT * INTO v_post FROM posts WHERE id = p_post_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Post not found';
    END IF;
    
    IF v_post.user_id = auth.uid() THEN
        RAISE EXCEPTION 'Cannot report your own post';
    END IF;
    
    INSERT INTO reports (post_id, reporter_id, reason) 
    VALUES (p_post_id, auth.uid(), p_reason)
    ON CONFLICT (post_id, reporter_id) DO NOTHING;
    
    SELECT count(*) INTO v_report_count FROM reports WHERE post_id = p_post_id;
    
    IF v_report_count >= 3 THEN
        UPDATE posts SET status = 'hidden', report_count = v_report_count WHERE id = p_post_id;
    ELSE
        UPDATE posts SET report_count = v_report_count WHERE id = p_post_id;
    END IF;
END;
$$;

-- public_stats
CREATE OR REPLACE FUNCTION public_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT jsonb_build_object(
        'open_offers', (SELECT count(*) FROM posts WHERE type = 'offer' AND status = 'open' AND expires_at > now()),
        'open_wanted', (SELECT count(*) FROM posts WHERE type = 'request' AND status = 'open' AND expires_at > now()),
        'done', (SELECT count(*) FROM posts WHERE status = 'done')
    );
$$;

-- my_post_stats
-- FIX 1: the "matches" badge used a different rule (similarity >= 0.35) than the "Possible matches" list (> 0.1), so the
--        badge said 0 while the list showed 2. It now calls match_posts(), so the two can never disagree (max 10).
-- FIX 2: contact_taps counts distinct people, not raw taps.
CREATE OR REPLACE FUNCTION my_post_stats()
RETURNS TABLE (post_id uuid, contact_taps bigint, match_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS post_id,
        (SELECT count(DISTINCT cr.user_id) FROM contact_reveals cr WHERE cr.post_id = p.id) AS contact_taps,
        (SELECT count(*) FROM match_posts(p.type, p.title, p.model_number, p.category, p.id)) AS match_count
    FROM posts p
    WHERE p.user_id = auth.uid();
END;
$$;

-- delete_my_account
CREATE OR REPLACE FUNCTION delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;

-- 9. API PERMISSIONS (GRANTs)
-- FIX: Supabase projects created after 30 May 2026 no longer expose new tables/functions in "public" to the API
-- automatically; without explicit GRANTs every request fails with "permission denied". These grants are also
-- least-privilege on purpose: Row Level Security still decides which ROWS each role may touch.
GRANT USAGE ON SCHEMA public TO anon, authenticated;

REVOKE ALL ON posts FROM anon, authenticated;
GRANT SELECT ON posts TO anon;                                   -- signed-out visitors can browse
GRANT SELECT, INSERT, UPDATE, DELETE ON posts TO authenticated;

REVOKE ALL ON profiles FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON profiles TO authenticated;   -- own row only, enforced by RLS

-- internal tables: only the SECURITY DEFINER functions above touch these
REVOKE ALL ON app_settings, reports, contact_reveals FROM anon, authenticated;

-- functions visitors may call (browse "possible matches", home counter)
REVOKE ALL ON FUNCTION match_posts(post_type, text, text, post_category, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public_stats() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION match_posts(post_type, text, text, post_category, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public_stats() TO anon, authenticated;

-- functions for signed-in members only
REVOKE ALL ON FUNCTION reveal_contact(uuid), report_post(uuid, text), my_post_stats(), delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION reveal_contact(uuid), report_post(uuid, text), my_post_stats(), delete_my_account() TO authenticated;

-- helpers that RLS policies call while running as the requesting role
REVOKE ALL ON FUNCTION is_member(), is_domain_allowed() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION is_member(), is_domain_allowed() TO anon, authenticated;
