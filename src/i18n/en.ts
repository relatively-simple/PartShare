export const t = {
  app: {
    name: 'PartShare',
    tagline: 'Give parts a second life'
  },
  nav: {
    home: 'Home',
    myPosts: 'My Posts',
    signIn: 'Sign in with Google',
    signOut: 'Sign out',
    inviteFriends: 'Invite friends'
  },
  home: {
    heroTitle: 'Share parts, save money, reduce waste',
    heroSubtitle: 'A community platform to share leftover electronic and mechanical parts.',
    tabOffers: 'Offers',
    tabRequests: 'Requests',
    searchPlaceholder: 'Search for parts...',
    filterCategory: 'Category',
    filterCondition: 'Condition',
    filterSort: 'Sort by',
    emptyStateTitle: 'No parts found',
    emptyStateDesc: 'Try adjusting your filters or search query.',
    statsOpenOffers: 'open offers',
    statsOpenWanted: 'open requests',
    statsDone: 'items shared'
  },
  postCard: {
    qty: 'Qty:',
    condition: 'Condition:',
    shareMode: 'Share mode:',
    posted: 'Posted',
    expires: 'Expires',
    neededBy: 'Needed by:'
  },
  postForm: {
    titleNewOffer: 'New Offer',
    titleNewRequest: 'New Request',
    titleEditOffer: 'Edit Offer',
    titleEditRequest: 'Edit Request',
    fieldTitle: 'Title',
    fieldCategory: 'Category',
    fieldModel: 'Model number (optional)',
    fieldQty: 'Quantity',
    fieldCondition: 'Condition',
    fieldDetails: 'Additional details (optional)',
    fieldShareMode: 'Share mode',
    fieldLocation: 'Location',
    fieldNeededBy: 'Needed by (optional)',
    btnSubmit: 'Submit Post',
    btnSave: 'Save Changes',
    btnCancel: 'Cancel'
  },
  postDetail: {
    btnRevealContact: 'Reveal Contact',
    btnEdit: 'Edit Post',
    btnMarkDone: 'Mark as Done',
    btnReport: 'Report Post',
    sectionDetails: 'Details',
    sectionLocation: 'Location',
    sectionAuthor: 'Posted by'
  },
  myPosts: {
    title: 'My Posts',
    emptyStateTitle: 'You have no posts',
    emptyStateDesc: 'Share something you no longer need or request something you are looking for.',
    btnCreate: 'Create a Post',
    statusOpen: 'Open',
    statusDone: 'Done',
    statusHidden: 'Hidden'
  },
  onboarding: {
    title: 'Welcome to PartShare',
    subtitle: 'Complete your profile to get started',
    fieldDisplayName: 'Display Name',
    fieldWhatsapp: 'WhatsApp Number',
    fieldLocation: 'Default Location',
    consentText: 'I agree to the terms and conditions',
    btnSubmit: 'Complete Profile'
  },
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success'
  }
} as const;
