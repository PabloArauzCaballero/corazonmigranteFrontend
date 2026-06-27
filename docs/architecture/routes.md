# Rutas

## Público
- `/`: landing.
- `/login`: login paciente.
- `/registro`: registro paciente.
- `/booking`: solicitud de cita pública.
- `/privacidad`: política de privacidad base.
- `/terminos`: términos base.
- `/admin/login`: login administrativo/terapeuta.

## Paciente
- `/paciente`: dashboard paciente.
- `/paciente/citas`: citas del paciente.
- `/paciente/perfil`: perfil del paciente.

## Terapeuta
- `/terapeuta`: dashboard terapeuta.
- `/terapeuta/agenda`: agenda asignada.
- `/terapeuta/perfil`: perfil profesional.

## Admin
- `/admin`: dashboard operativo.
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
