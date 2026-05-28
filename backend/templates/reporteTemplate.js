function generarHTMLReporte(data) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body{
                font-family: Arial, sans-serif;
                background:#0f172a;
                color:white;
                padding:40px;
            }

            .card{
                background:#1e293b;
                padding:20px;
                border-radius:20px;
                margin-bottom:20px;
            }

            h1{
                margin:0 0 20px;
            }
        </style>
    </head>
    <body>

        <h1>Reporte Diario</h1>

        <div class="card">
            <h2>Técnico</h2>
            <p>${data.tecnico}</p>
        </div>

        <div class="card">
            <h2>Servicios</h2>
            <p>${data.cantidadServicios}</p>
        </div>

        <div class="card">
            <h2>Ingresos</h2>
            <p>S/. ${data.totalIngresos}</p>
        </div>

        <div class="card">
            <h2>Utilidad</h2>
            <p>S/. ${data.utilidadTotal}</p>
        </div>

    </body>
    </html>
    `;
}

module.exports = { generarHTMLReporte };
