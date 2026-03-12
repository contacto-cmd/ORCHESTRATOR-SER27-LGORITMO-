<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>SER27 LGORITMO — Sovereign Orchestrator</title>
  <style>
    body {
      background-color: black;
      color: gold;
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
    }
    header {
      background-color: #111;
      color: royalblue;
      padding: 20px;
      text-align: center;
      border-bottom: 2px solid gold;
    }
    main {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 30px;
    }
    button {
      background-color: royalblue;
      color: gold;
      border: none;
      padding: 12px 24px;
      margin: 8px;
      cursor: pointer;
      font-size: 16px;
      border-radius: 4px;
    }
    button:hover {
      background-color: gold;
      color: black;
    }
  </style>
</head>
<body>
  <header>
    <h1>SER27 LGORITMO — Sovereign Orchestrator</h1>
  </header>
  <main>
    <button onclick="deploy()">Deploy Backend</button>
    <button onclick="refresh()">Refresh Frontend</button>
    <button onclick="verifyDNS()">Verify DNS</button>
    <button onclick="logIncident()">Log Incident</button>
    <button onclick="certify()">Certify Document</button>
  </main>

  <!-- Aquí enlazas tu script -->
  <script src="../blueprint/orchestrator.functions.js"></script>
</body>
</html>
