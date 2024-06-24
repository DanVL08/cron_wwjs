// Importa los módulos necesarios
const Qr = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { obtenerPagosDelAlumno } = require('./respuestasApi.js');
const { obtenerArrayDeAlumnosSinPagoEsteMes } = require('./datosDePagos.js');
const logger = require('./logger.js');

// Configura el cliente de WhatsApp Web
const client = new Client({
    authStrategy: new LocalAuth(),
});

client.on('qr', (qr) => {
    Qr.generate(qr, { small: true });
});

client.on('ready', async () => {
    logger.info('Client is ready!');
    await ejecutarTareaDiaria();
    process.exit(0); // Termina el proceso después de completar la tarea
});

client.on('error', (error) => {
    logger.error("Error en el cliente de WhatsApp: " + error.message);
    process.exit(1); // Termina el proceso si hay un error
});

client.initialize();

async function ejecutarTareaDiaria() {
    try {
        const fechaActual = new Date();
        logger.info("Ejecutando tarea diaria a las " + fechaActual);

        await enviarMensajeALosAlumnosSinPago();
        logger.info("Tarea diaria completada con éxito.");
    } catch (error) {
        logger.error("Error ejecutando la tarea diaria: " + error.message);
    }
}

async function enviarMensaje(numeroDeTelefono, textoDelMensaje) {
    const numero = '52' + numeroDeTelefono;
    const texto = textoDelMensaje;

    try {
        const phoneRegistered = await client.getNumberId(numero);
        await client.sendMessage(phoneRegistered._serialized, texto);
    } catch (error) {
        logger.error("Error al enviar el mensaje:", error);
    }
}

async function enviarMensajeALosAlumnosSinPago() {
    const alumnosSinPago = await obtenerArrayDeAlumnosSinPagoEsteMes();
    if (!alumnosSinPago || alumnosSinPago.length === 0) {
        logger.info("No hay alumnos sin pago este mes.");
    } else {
        logger.info(`Se encontraron ${alumnosSinPago.length} alumnos sin pago este mes.`);
        for (const alumno of alumnosSinPago) {
            logger.info(`Enviando mensaje a: ${alumno.nombre}`);
            const mensaje = `Hola ${alumno.nombre}, esperando que se encuentre muy bien, le saluda la Preparatoria Federal por Coperación. ` +
                `Le invitamos a realizar el pago correspondiente de este mes. Si ya realizó su pago, por favor infórmelo a nuestras oficinas. ¡Saludos!`;

            await esperar(180000); // 3 minutos
            await enviarMensaje(alumno.telefono, mensaje);
        }
    }
}
