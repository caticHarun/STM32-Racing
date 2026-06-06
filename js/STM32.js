const baud = 115200;

const commands = {
    connected: "Harun_Catic_STM32_Controller",
    left: "LEFT",
    right: "RIGHT",
    break: "BREAK",
    change_direction: "CHANGE_DIRECTION",
    speed: "SPEED_CHANGE_",
    speed_end: "_END",
};
const cancel_command = "X_";

let instructions = "";

export const connect_controller_button = () => {
    try {
        const button = document.querySelector("#controller_start #controller_connect_button");
        button.addEventListener("click", async () => {
            button.textContent = "Loading"; //HC_UPDATE spinner

            const port = await navigator.serial.requestPort();
            await port.open({ baudRate: baud });

            //HC_UPDATE napisi odaberite projekat 2

            while (port.readable) {
                const reader = port.readable.getReader();

                try {
                    while (true) {
                        const { value, done } = await reader.read();

                        if (value === "JARIM")
                            document.querySelector("#controller_start").remove(); //HC_UPDATE

                        for (let i = 0; i < value.length; i++) {
                            instructions += String.fromCharCode(value[i]);
                        }

                        check_for_valid_instruction();

                        if (done) {
                            // |reader| has been canceled.
                            break;
                        }
                        // Do something with |value|…
                    }
                } catch (error) {
                    // Handle |error|…
                } finally {
                    reader.releaseLock();
                }
            }
        });
    } catch (error) {

    }
};

const check_for_valid_instruction = () => {
    const instruction_arr = instructions.split("\n");

    const ret = instruction_arr.splice(instruction_arr.length - 1, 1);
    instructions = ret;

    instruction_arr.forEach((instruction, index) => {
        Object.values(commands).forEach(command => {
            if (instruction === command || instruction == `${cancel_command}${command}`) {
                console.log('COMMAND', instruction); //HC_REMOVE
            }
        });


        if (instruction.includes(commands.speed) && instruction.includes(commands.speed_end)) {
            const speed = Number(instruction.replace(commands.speed, "").replace(commands.speed_end, ""));

            if(Number.isFinite(speed) && speed >= 0 && speed <= 100){
                console.log('SPEED CHANGE', speed); //HC_REMOVE
            }
        }
    });
};