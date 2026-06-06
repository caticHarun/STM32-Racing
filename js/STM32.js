const baud = 115200;

const commands = {
    connected: "Harun_Catic_STM32_Controller",
    left: "LEFT",
    right: "RIGHT",
    break: "BREAK",
    change_direction: "CHANGE_DIRECTION",
    speed: "SPEED_CHANGE_",
    speed_end: "_END", //HC_UPDATE make on STM32
};
const cancel_command = "X_"

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

                        for(let i=0; i<value.length; i++){
                            instructions += String.fromCharCode(value[i])
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
    const indexes_to_remove = [];

    instruction_arr.forEach((instruction, index) => {
        Object.values(commands).forEach(command => {
            if(instruction === command || instruction == `${cancel_command}${command}`) {
                console.log('COMMAND', instruction); //HC_REMOVE
                indexes_to_remove.push(index);
            }

            else if(instruction.includes(commands.speed)){
                const speed = Number(instruction.replace(commands.speed, ""));
                console.log('Speed', speed); //HC_REMOVE
                indexes_to_remove.push(index);
            }
        })
    })

    indexes_to_remove.reverse();
    indexes_to_remove.forEach(index => {
        instruction_arr.splice(index, 1);
    })

    instructions = instruction_arr.filter(el => !!el.trim()).join("\n");
}