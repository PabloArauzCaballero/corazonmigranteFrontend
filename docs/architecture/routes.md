# Rutas

## Público
- `/`: landing.
- `/login`: login paciente.
- `/registro`: registro paciente.
- `/booking`: puerta de acceso. No muestra formulario público; redirige conceptualmente según sesión.
- `/privacidad`: política de privacidad base.
- `/terminos`: términos base.
- `/admin/login`: login administrativo.

## Paciente
- `/paciente`: dashboard paciente.
- `/paciente/booking`: reserva de cita para el paciente autenticado.
- `/paciente/citas`: citas del paciente.
- `/paciente/perfil`: perfil del paciente.

## Terapeuta
- `/terapeuta`: dashboard terapeuta.
- `/terapeuta/agenda`: agenda asignada.
- `/terapeuta/booking`: preparación de cita para paciente concreto. Requiere contrato backend pendiente.
- `/terapeuta/perfil`: perfil profesional.

## Admin
- `/admin`: dashboard operativo.
- `/admin/booking`: preparación de cita para paciente concreto. Requiere contrato backend pendiente.
- `/admin/solicitudes`: solicitudes de cita.
- `/admin/usuarios`: usuarios.
- `/admin/productos/enfoques`: enfoques terapéuticos.
- `/admin/productos/servicios`: servicios/productos.
- `/admin/vistas-publicas`: CMS simple.
- `/admin/contabilidad`: selector contable.
- `/admin/contabilidad/cuentas`: cuentas.
- `/admin/contabilidad/grupos-cuenta`: grupos de cuenta.
- `/admin/contabilidad/centros-costo`: centros de costo.
- `/admin/contabilidad/transacciones`: transacciones.

## DECISION_CM
Se elimina la duplicidad conceptual `/portal-admin` y `/auth/admin/login`. La ruta canónica administrativa es `/admin/login`.
