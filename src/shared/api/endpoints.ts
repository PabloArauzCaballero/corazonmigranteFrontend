export const ENDPOINTS = {
  auth: {
    login: "/api/usuarios/login",
    registerPatient: "/api/usuarios/signup/paciente",
    requestPin: "/api/usuarios/password-recovery/request",
    verifyPin: "/api/usuarios/verify-pin",
    resetPassword: "/api/usuarios/password/recovery/update"
  },
  users: {
    list: "/api/usuarios/super_usuarios/estado/listar",
    createAdmin: "/api/usuarios/signup/admin",
    createTherapist: "/api/usuarios/signup/terapeuta",
    updateAdmin: "/api/usuarios/admin/modificar",
    updateTherapist: "/api/usuarios/terapeuta/modificar",
    updateStatus: "/api/usuarios/super_usuarios/:userId/estado"
  },
  therapy: {
    appointmentRequests: "/api/terapia/admin/citas/solicitudes/listar",
    createAppointment: "/api/terapia/citas/registrar",
    updateAppointmentStatus: "/api/terapia/citas/estados/actualizar",
    rescheduleAppointment: "/api/terapia/citas/detalle/actualizar",
    deleteAppointment: "/api/terapia/citas/apagar",
    bookingBootstrap: "/api/terapia/booking/bootstrap",
    schedulesAvailability: "/api/terapia/horarios/obtener-disponibilidad",
    schedulesGet: "/api/terapia/horarios/obtener",
    schedulesCreate: "/api/terapia/horarios/crear",
    schedulesUpdate: "/api/terapia/horarios/actualizar-versionado",
    schedulesDelete: "/api/terapia/horarios/apagar"
  },
  products: {
    approachesCreate: "/api/terapia/enfoques/crear",
    approachesCreateWithFile: "/api/terapia/enfoques/crear-con-archivo",
    approachesUpdate: "/api/terapia/enfoques/modificar",
    approachesUpdateWithFile: "/api/terapia/enfoques/modificar-con-archivo",
    approachesList: "/api/terapia/enfoques/listar",
    approachesDelete: "/api/terapia/enfoques/apagar",
    productsCreate: "/api/terapia/productos/crear",
    productsUpdate: "/api/terapia/productos/modificar",
    productsList: "/api/terapia/productos/listar",
    productsDelete: "/api/terapia/productos/apagar",
    bootstrapApproachProduct: "/api/terapia/bootstrap/enfoque-producto"
  },
  publicUi: {
    pageBundle: "/api/publico/ui/pagina-publica",
    elementsList: "/api/publico/ui/elementos/listar",
    elementsCreate: "/api/publico/ui/elementos/crear",
    elementsUpdate: "/api/publico/ui/elementos/actualizar",
    elementsUpdateWithFile: "/api/publico/ui/elementos/actualizar-con-archivo",
    elementsDelete: "/api/publico/ui/elementos/apagar",
    filesList: "/api/files/list",
    filesUpload: "/api/files/upload",
    filesDownload: "/api/files/download",
    filesDelete: "/api/files/delete"
  },
  accounting: {
    accountGroupsList: "/api/contabilidad/grupos-cuenta/listar",
    accountGroupsCreate: "/api/contabilidad/grupos-cuenta/crear",
    accountGroupsUpdate: "/api/contabilidad/grupos-cuenta/editar",
    accountGroupsDelete: "/api/contabilidad/grupos-cuenta/apagar",
    accountsList: "/api/contabilidad/cuentas/listar",
    accountsCreate: "/api/contabilidad/cuentas/crear",
    accountsUpdate: "/api/contabilidad/cuentas/editar",
    accountsDelete: "/api/contabilidad/cuentas/apagar",
    costCentersList: "/api/contabilidad/centros-costo/listar",
    costCentersCreate: "/api/contabilidad/centros-costo/crear",
    costCentersUpdate: "/api/contabilidad/centros-costo/editar",
    costCentersDelete: "/api/contabilidad/centros-costo/apagar",
    transactionsList: "/api/contabilidad/transacciones/listar",
    transactionsBatchCreate: "/api/contabilidad/transacciones/batch/crear",
    transactionSaleCreate: "/api/contabilidad/transacciones/venta/crear"
  }
} as const;
