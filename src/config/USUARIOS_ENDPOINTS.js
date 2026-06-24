export const USUARIOS_ENDPOINTS = {
    LOGIN: "/api/usuarios/login",
    REQUEST_PIN: "/api/usuarios/password-recovery/request",
    REQUEST_NEW_PIN_AUTH: "/api/usuarios/auth-pin/request",
    VERIFY_PIN: "/api/usuarios/verify-pin",
    RESET_PASSWORD: "/api/usuarios/password/recovery/update",

    REGISTRAR_ADMIN: "/api/usuarios/signup/admin",
    REGISTRAR_TERAPEUTA: "api/usuarios/signup/terapeuta",
    REGISTRAR_PACIENTE: "/api/usuarios/signup/paciente",
    USUARIOS_LISTAR: "/api/usuarios/super_usuarios/estado/listar",

    USUARIOS_ACTUALIZAR_ESTADO: "/api/usuarios/super_usuarios/:/estado",
    OBTENER_ADMIN: "/api/usuarios/obtener/admin",
    OBTENER_TERAPEUTA: "/api/usuarios/obtener/terapeuta",
    TERAPEUTAS_SIN_ADMIN_LISTAR: "/api/usuarios/terapeutas/sin-admin-activo",


    UPDATE_USUARIOS_TERAPEUTA: "/api/usuarios/terapeuta/modificar",
    UPDATE_USUARIOS_ADMIN: "/api/usuarios/admin/modificar",
    OBTENER_USUARIO_TERAPEUTA: "/api/usuarios/obtener/admin",
    OBTENER_USUARIO_ADMIN: "/api/usuarios/obtener/terapeuta",

    USUARIO_ACTUALIZAR_CON_ARCHIVO: "/api/usuarios/archivo/actualizar-con-archivo",
    TERAPEUTA_ACTUALIZAR_CON_ARCHIVO: "/api/usuarios/terapeuta/:user_id/con-archivo",
};