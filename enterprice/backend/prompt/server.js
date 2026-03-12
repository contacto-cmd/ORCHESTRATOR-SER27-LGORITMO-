## Backend Soberano — server.js

- Núcleo ejecutor en Node.js.
- Endpoints principales:
  - `/deploy` → Railway (despliegue backend).
  - `/refresh` → Vercel (reconstrucción frontend).
  - `/dns` → Cloudflare (verificación de registros).
  - `/incident` → Audit Layer (registro de eventos).
  - `/certify` → Throne Protocolo v3.0 (certificación soberana).
- Opcional: WebSocket para estado en vivo del cockpit.
- Cada acción queda firmada y registrada en el Audit Layer.
