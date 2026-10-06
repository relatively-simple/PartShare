import React from 'react';

export function About() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">About PartShare</h1>
      <div className="card p-6 bg-white space-y-4 text-gray-700">
        <p>
          PartShare was built with a simple mission: to help university students and DIY makers share leftover electronic and mechanical parts instead of throwing them away or buying new ones.
        </p>
        <p>
          We know how expensive parts can be for projects, and we know how many perfectly good components end up in a box under the bed after a project is finished. PartShare connects makers who have parts with makers who need them.
        </p>
        <p>
          This is a free, zero-waste community. There are no payments, no shipping fees, and no in-app ads. Let's save money, reduce wait times, and cut down on e-waste together!
        </p>
      </div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">How It Works</h1>
      <div className="card p-6 bg-white space-y-6 text-gray-700">
        <div>
          <h3 className="text-xl font-semibold mb-2">1. Browse or Search</h3>
          <p>Looking for a specific motor, sensor, or microcontroller? Search the "Available" tab to see if someone on campus is giving it away, lending it, or swapping it.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">2. Make a Request</h3>
          <p>If you can't find what you need, post it in the "Wanted" tab. Our system will automatically suggest your request to people who post matching offers.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">3. Connect on WhatsApp</h3>
          <p>When you find a match, hit the "Contact on WhatsApp" button. We'll automatically start a chat with the person who posted the listing.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">4. Meet Up</h3>
          <p>Arrange a time to meet up in a public spot on campus to hand over the parts. Once the exchange is done, mark your post as "Taken" or "Found"!</p>
        </div>
      </div>
    </div>
  );
}

export function Rules() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Community Rules & Safety</h1>
      <div className="card p-6 bg-white space-y-4 text-gray-700">
        <ul className="list-disc pl-6 space-y-3">
          <li><strong>No illegal or dangerous items:</strong> Do not post hazardous materials, chemicals, weapons, or any illegal items.</li>
          <li><strong>Meet in public:</strong> Always arrange to meet in public, well-lit campus spots (like the library, student union, or makerspace) during daylight hours.</li>
          <li><strong>Inspect batteries:</strong> LiPo batteries can be extremely dangerous. Always inspect them for swelling, punctures, or damage before exchanging or using them. Do not share damaged batteries.</li>
          <li><strong>No responsibility:</strong> PartShare provides a platform to connect students, but we hold no responsibility for the condition of the parts, safety of the exchange, or any damages caused by the parts. Exchange at your own risk.</li>
          <li><strong>Be respectful:</strong> This is a community built on trust and sharing. Be punctual, polite, and respectful of other members' time and property.</li>
        </ul>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="card p-6 bg-white space-y-4 text-gray-700">
        <h3 className="text-xl font-semibold mt-4">What we store</h3>
        <p>We store your Google display name, your provided WhatsApp number, your location preference, and the posts you create. We also log when you click "Contact" on a post to prevent spam and rate-limit requests.</p>
        
        <h3 className="text-xl font-semibold mt-4">Who can see your data</h3>
        <p>
          Your WhatsApp number is <strong>never</strong> displayed publicly on the website. It is only revealed securely to other signed-in community members when they explicitly click the "Contact on WhatsApp" button on one of your active listings.
        </p>
        <p>
          Your display name and location are visible to everyone (including guests) on the posts you create.
        </p>

        <h3 className="text-xl font-semibold mt-4">Your rights</h3>
        <p>
          You can delete your posts at any time. You can also completely delete your account and all associated data from the "My Posts" page.
        </p>
      </div>
    </div>
  );
}
