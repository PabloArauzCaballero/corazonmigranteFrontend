export const API_PREFIX = "/api/v1" as const;

export const ENDPOINTS = {
  auth: {
    login: `${API_PREFIX}/auth/login`,
    registerPatient: `${API_PREFIX}/auth/register/patient`,
    registerTherapist: `${API_PREFIX}/auth/register/therapist`,
    refresh: `${API_PREFIX}/auth/refresh`,
    logout: `${API_PREFIX}/auth/logout`,
    requestPin: `${API_PREFIX}/auth/password-reset/request`,
    resetPassword: `${API_PREFIX}/auth/password-reset/confirm`
  },
  users: {
    me: `${API_PREFIX}/me`,
    list: `${API_PREFIX}/admin/users`,
    updatePatientProfile: `${API_PREFIX}/me/patient-profile`,
    updateTherapistProfile: `${API_PREFIX}/me/therapist-profile`,
    createAdmin: `${API_PREFIX}/admin/users`,
    createTherapist: `${API_PREFIX}/auth/register/therapist`,
    updateAdmin: `${API_PREFIX}/admin/users/:userId`,
    updateTherapist: `${API_PREFIX}/admin/users/:userId/therapist-profile`,
    updateStatus: `${API_PREFIX}/admin/users/:userId/status`,
    updateAvatar: `${API_PREFIX}/admin/users/:userId/avatar`,
    patients: `${API_PREFIX}/admin/users/patients`
  },
  appointments: {
    createMine: `${API_PREFIX}/appointments`,
    mine: `${API_PREFIX}/appointments/mine`,
    adminList: `${API_PREFIX}/appointments/admin/list`,
    updateStatus: `${API_PREFIX}/appointments/:appointmentId/status`,
    createForPatient: `${API_PREFIX}/appointments/admin`
  },
  booking: {
    availability: `${API_PREFIX}/booking/availability`,
    therapists: `${API_PREFIX}/booking/therapists`
  },
  therapy: {
    appointmentRequests: `${API_PREFIX}/appointments/admin/list`,
    patientAppointments: `${API_PREFIX}/appointments/mine`,
    therapistAgenda: `${API_PREFIX}/appointments/mine`,
    createAppointment: `${API_PREFIX}/appointments`,
    updateAppointmentStatus: `${API_PREFIX}/appointments/:appointmentId/status`,
    bookingAvailability: `${API_PREFIX}/booking/availability`,
    therapistSchedules: `${API_PREFIX}/therapists/me/schedules`,
    therapistBlockedTimes: `${API_PREFIX}/therapists/me/blocked-times`,
    adminTherapistSchedules: `${API_PREFIX}/admin/therapists/:therapistUserId/schedules`,
    adminTherapistScheduleById: `${API_PREFIX}/admin/therapists/:therapistUserId/schedules/:scheduleId`
  },
  products: {
    approachesCreate: `${API_PREFIX}/admin/therapy/approaches`,
    approachesCreateWithFile: `${API_PREFIX}/admin/therapy/approaches`,
    approachesUpdate: `${API_PREFIX}/admin/therapy/approaches/:approachId`,
    approachesUpdateWithFile: `${API_PREFIX}/admin/therapy/approaches/:approachId`,
    approachesList: `${API_PREFIX}/admin/therapy/approaches`,
    approachesPublicList: `${API_PREFIX}/therapy/approaches`,
    approachesDelete: `${API_PREFIX}/admin/therapy/approaches/:approachId`,
    productsCreate: `${API_PREFIX}/admin/therapy/products`,
    productsUpdate: `${API_PREFIX}/admin/therapy/products/:productId`,
    productsList: `${API_PREFIX}/admin/therapy/products`,
    productsPublicList: `${API_PREFIX}/therapy/products`,
    productsDelete: `${API_PREFIX}/admin/therapy/products/:productId`,
    bootstrapApproachProduct: `${API_PREFIX}/therapy/products`
  },
  cms: {
    publicPages: `${API_PREFIX}/public/pages`,
    publicPage: `${API_PREFIX}/public/pages/:slug`,
    adminListPages: `${API_PREFIX}/admin/cms/pages`,
    adminCreatePage: `${API_PREFIX}/admin/cms/pages`,
    adminAddElement: `${API_PREFIX}/admin/cms/pages/:pageId/elements`
  },
  files: {
    upload: `${API_PREFIX}/files`,
    cloudinarySignature: `${API_PREFIX}/files/cloudinary/signature`,
    cloudinaryComplete: `${API_PREFIX}/files/cloudinary/complete`,
    adminCloudinarySignature: `${API_PREFIX}/admin/files/cloudinary/signature`,
    adminCloudinaryComplete: `${API_PREFIX}/admin/files/cloudinary/complete`,
    signedUrl: `${API_PREFIX}/files/:fileId/signed-url`,
    download: `${API_PREFIX}/files/:fileId/download`,
    adminList: `${API_PREFIX}/admin/files`,
    adminUpload: `${API_PREFIX}/admin/files`,
    adminDetail: `${API_PREFIX}/admin/files/:fileId`,
    adminUpdate: `${API_PREFIX}/admin/files/:fileId`,
    adminDelete: `${API_PREFIX}/admin/files/:fileId`
  },
  editorial: {
    /**
     * Alias aplicación del módulo Biblioteca. Se apoya en el Contenido administrable:
     * GET /api/v1/public/pages/:slug + POST /api/v1/admin/cms/pages + POST /api/v1/admin/cms/pages/:pageId/elements.
     */
    publicPage: `${API_PREFIX}/public/pages/:slug`,
    adminListPages: `${API_PREFIX}/admin/cms/pages`,
    adminCreatePage: `${API_PREFIX}/admin/cms/pages`,
    adminAddElement: `${API_PREFIX}/admin/cms/pages/:pageId/elements`
  },
  content: {
    subscriptionMine: `${API_PREFIX}/me/news-subscription`,
    subscriptionPaymentConfig: `${API_PREFIX}/me/news-subscription/payment-config`,
    subscriptionRequest: `${API_PREFIX}/me/news-subscription/request`,
    premiumNewsDetail: `${API_PREFIX}/premium/publications/news/:slug`,
    premiumColumnDetail: `${API_PREFIX}/premium/publications/columns/:slug`,
    subscribe: `${API_PREFIX}/publications/subscribers`,
    adminSubscribers: `${API_PREFIX}/admin/content/subscribers`,
    adminSubscriberById: `${API_PREFIX}/admin/content/subscribers/:id`
  },
  publicUi: {
    pageBundle: `${API_PREFIX}/public/pages/:slug`,
    pageBySlug: `${API_PREFIX}/public/pages/:slug`,
    pageElementByCode: `${API_PREFIX}/public/pages/:slug`,
    pageElementById: `${API_PREFIX}/public/pages/:slug`,
    elementsList: `${API_PREFIX}/public/pages/:slug`,
    elementsCreate: `${API_PREFIX}/admin/cms/pages`,
    elementsUpdate: `${API_PREFIX}/admin/cms/pages/:pageId/elements`,
    elementsUpdateWithFile: `${API_PREFIX}/admin/cms/pages/:pageId/elements`,
    elementsDelete: `${API_PREFIX}/admin/cms/pages/:pageId/elements/:elementId`,
    filesList: `${API_PREFIX}/files`,
    filesUpload: `${API_PREFIX}/files`,
    filesDownload: `${API_PREFIX}/files/:fileId/download`,
    filesDelete: `${API_PREFIX}/files/:fileId`
  },
  accounting: {
    accountGroupsList: `${API_PREFIX}/admin/accounting/account-groups`,
    accountGroupsCreate: `${API_PREFIX}/admin/accounting/account-groups`,
    accountGroupsUpdate: `${API_PREFIX}/admin/accounting/account-groups/:groupId`,
    accountGroupsDelete: `${API_PREFIX}/admin/accounting/account-groups/:groupId`,
    accountsList: `${API_PREFIX}/admin/accounting/accounts`,
    accountsCreate: `${API_PREFIX}/admin/accounting/accounts`,
    accountsUpdate: `${API_PREFIX}/admin/accounting/accounts/:accountId`,
    accountsDelete: `${API_PREFIX}/admin/accounting/accounts/:accountId`,
    costCentersList: `${API_PREFIX}/admin/accounting/cost-centers`,
    costCentersCreate: `${API_PREFIX}/admin/accounting/cost-centers`,
    costCentersUpdate: `${API_PREFIX}/admin/accounting/cost-centers/:costCenterId`,
    costCentersDelete: `${API_PREFIX}/admin/accounting/cost-centers/:costCenterId`,
    transactionsList: `${API_PREFIX}/admin/accounting/transactions`,
    transactionsCreate: `${API_PREFIX}/admin/accounting/transactions`,
    transactionSaleCreate: `${API_PREFIX}/admin/accounting/transactions`
  },
  health: {
    check: `${API_PREFIX}/health`
  }
} as const;
