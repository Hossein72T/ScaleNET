let port;
let reader;
let inputDone;
let outputDone;
let inputStream;
let outputStream;

const connectButton = document.getElementById('connectButton');
const disconnectButton = document.getElementById('disconnectButton');
const ledOnButton = document.getElementById('ledOnButton');
const ledOffButton = document.getElementById('ledOffButton');
const output = document.getElementById('output');

connectButton.addEventListener('click', async () => {
    try {
        port = await navigator.serial.requestPort();
        await port.open({ baudRate: 9600 });

        const textEncoder = new TextEncoderStream();
        outputDone = textEncoder.readable.pipeTo(port.writable);
        outputStream = textEncoder.writable;

        const textDecoder = new TextDecoderStream();
        inputDone = port.readable.pipeTo(textDecoder.writable);
        inputStream = textDecoder.readable.pipeTo(new WritableStream({
            write(value) {
                output.value += value;
            }
        }));

        connectButton.disabled = true;
        disconnectButton.disabled = false;
        ledOnButton.disabled = false;
        ledOffButton.disabled = false;
    } catch (e) {
        console.error(e);
    }
});

disconnectButton.addEventListener('click', async () => {
    if (reader) {
        await reader.cancel();
        await inputDone.catch(() => { /* Ignore the error */ });
        reader = null;
        inputDone = null;
    }

    if (outputStream) {
        await outputStream.getWriter().close();
        await outputDone;
        outputStream = null;
        outputDone = null;
    }

    await port.close();
    port = null;

    connectButton.disabled = false;
    disconnectButton.disabled = true;
    ledOnButton.disabled = true;
    ledOffButton.disabled = true;
});

ledOnButton.addEventListener('click', async () => {
    const writer = outputStream.getWriter();
    await writer.write('1');
    writer.releaseLock();
});

ledOffButton.addEventListener('click', async () => {
    const writer = outputStream.getWriter();
    await writer.write('0');
    writer.releaseLock();
});