# Manual de Documentación: CES Connect

**CES Connect** es una plataforma de gestión colaborativa diseñada para el **Consejo Económico y Social (CES)** de San Miguel de Tucumán. Su objetivo es facilitar el debate, la recopilación de aportes técnicos y la generación de conclusiones institucionales potenciadas por Inteligencia Artificial.

---

## 1. Roles y Permisos

El sistema se basa en un modelo de **Control de Acceso Basado en Roles (RBAC)** con dos niveles principales:

### 👤 Usuario Común (Participante)
Es el rol asignado por defecto a todos los nuevos registros. Está orientado a los integrantes de las comisiones que participan del debate.
*   **Acceso a Reuniones:** Solo puede ver las reuniones a las que ha sido invitado formalmente o en las que figura como participante.
*   **Participación:** Puede enviar aportes formales (con archivos adjuntos) y participar en el chat de debate en tiempo real.
*   **Visualización:** Puede ver todos los aportes de sus colegas, los documentos subidos y el resultado final de la reunión.
*   **Reportes:** Puede descargar el reporte generado por la IA una vez que la reunión ha sido finalizada.
*   **Restricciones:** No puede crear comisiones, ni crear reuniones, ni finalizar sesiones, ni generar resúmenes con IA.

### 🛡️ Usuario Administrador
Es el rol con control total sobre la gobernanza de la plataforma.
*   **Gestión de Comisiones:** Puede crear, editar y eliminar comisiones (áreas temáticas).
*   **Gestión de Reuniones:** Crea reuniones, defina la fecha, la descripción y asigna participantes.
*   **Control de Sesión:** Es el único habilitado para "Finalizar" una reunión, bloqueando nuevos aportes.
*   **Inteligencia Artificial:** Solo el administrador puede disparar los procesos de generación de resúmenes y extracción de puntos clave mediante IA.
*   **Devolución Institucional:** Carga la conclusión final y el nivel de progreso de cada encuentro en la pestaña "Resultado".
*   **Directorio:** Gestiona la lista global de participantes habilitados en el sistema desde la pestaña de Participantes.

---

## 2. Gestión de Usuarios

### Registro y Creación
1.  **Auto-registro:** Cualquier usuario puede crear una cuenta desde la pantalla de inicio completando su nombre, cargo y organización.
2.  **Asignación de Rol:** 
    *   Por defecto, el sistema asigna el rol `común`.
    *   Existe una regla lógica que otorga el rol `admin` si el correo electrónico contiene la palabra `admin` (esto se mapea en `AuthContext.tsx`).
3.  **Identidad:** El sistema utiliza **Supabase Auth** para garantizar la seguridad de las credenciales y la gestión de sesiones.

---

## 3. Funcionamiento de la Plataforma

El flujo de trabajo típico en CES Connect sigue estos pasos:

### A. Creación del Espacio (Comisiones)
El Administrador crea una **Comisión** (ej: "Movilidad Urbana"). Cada comisión agrupa todas las discusiones y reuniones relacionadas con ese tema.

### B. Ejecución de la Reunión
Dentro de una comisión, se crea una **Reunión**. Durante el encuentro (o de forma asincrónica):
1.  **Aportes:** Los participantes suben documentos (PDF, DOC, TXT) o escriben propuestas técnicas.
2.  **Debate:** Se utiliza el chat integrado para discutir los aportes en tiempo real.
3.  **Archivos:** Se centraliza toda la documentación técnica adjunta en una pestaña dedicada.

### C. Cierre y Análisis con IA
Una vez concluido el debate, el administrador pulsa **"Finalizar Reunión"**. Esto cierra la posibilidad de seguir editando y activa las funciones avanzadas:
1.  **Resumen de IA:** El sistema envía todos los aportes y el chat a través de **OpenRouter (GPT-4o)** para generar un resumen ejecutivo profesional.
2.  **Puntos Clave:** La IA extrae los acuerdos y desacuerdos más relevantes.
3.  **Reporte Descargable:** Se ofrece un botón para descargar un archivo `.txt` con toda la información consolidada para los participantes.

---

## 4. Estructura Técnica
*   **Base de Datos:** PostgreSQL (vía Supabase).
*   **Seguridad:** RLS (Row Level Security) en Supabase para proteger los datos.
*   **IA:** Integración con OpenRouter usando modelos GPT-4o-mini para eficiencia y velocidad.

---
*Desarrollado por la Dirección de Inteligencia Artificial - Municipalidad de San Miguel de Tucumán.*
