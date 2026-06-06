// Variables
const baud = 115200;
export const commands = {
    connected: "Harun_Catic_STM32_Controller",
    left: "LEFT",
    right: "RIGHT",
    break: "BREAK",
    change_direction: "CHANGE_DIRECTION",
    speed: "SPEED_CHANGE_",
    speed_end: "_END",
};
export const cancel_command = "X_";
export let stm32_ready = 0;

// DOM
const connect_controller = document.querySelector("#controller_start");
const controller_not_connected_div = document.querySelector("#controller_not_connected");
const controller_not_started_div = document.querySelector("#controller_not_started");
const speed_not_set_div = document.querySelector("#speed_not_set");

//Stats
export let speed = 0;
export let display_direction = 1;
const forward_max_display_kmh = 240;
const reverse_max_display_kmh = 80;

const updateSpeedDisplays = () => {
    const max_display_kmh = display_direction === -1 ? reverse_max_display_kmh : forward_max_display_kmh;
    const kmh = Math.round((speed / 100) * max_display_kmh);

    document.querySelectorAll(".speed_value").forEach((speed_value) => {
        const speed_kmh = speed_value.querySelector(".speed_kmh");
        const speed_percent = speed_value.querySelector(".speed_percent");

        speed_value.style.setProperty("--speed-percent", speed);
        speed_value.style.setProperty("--speed-angle", `${speed * 1.8}deg`);
        speed_value.style.setProperty("--needle-angle", `${-90 + speed * 1.8}deg`);

        if (speed_kmh) speed_kmh.textContent = kmh;
        if (speed_percent) speed_percent.textContent = `${speed}%`;
    });
};

export const updateVehicleDirectionDisplay = (direction) => {
    display_direction = direction === -1 ? -1 : 1;

    document.querySelectorAll(".race-hud").forEach((hud) => {
        const direction_label = hud.querySelector(".direction-label");

        hud.classList.toggle("direction-backward", display_direction === -1);
        hud.classList.toggle("direction-forward", display_direction !== -1);
        if (direction_label) direction_label.innerHTML = display_direction === -1 ? "R&uuml;ckw&auml;rts" : "Vorw&auml;rts";
    });

    updateSpeedDisplays();
};

const updateSpeed = (value) => {
    speed = value;
    updateSpeedDisplays();
};

// Instructions
let instructions = "";

export const instructions_to_execute = [];

export const connect_controller_button = () => {
    try {
        const connect_button = document.querySelector("#controller_start #controller_connect_button");

        connect_button.addEventListener("click", async () => {
            connect_button.textContent = "Verbinde...";
            connect_button.disabled = true;

            try {
                const port = await navigator.serial.requestPort();
                await port.open({ baudRate: baud });

                controller_not_connected_div.classList.add("hidden");
                controller_not_started_div.classList.remove("hidden");

                while (port.readable) {
                    const reader = port.readable.getReader();

                    try {
                        while (true) {
                            const { value, done } = await reader.read();

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
            } catch (error) {
                window.alert(`Fehler beim Verbinden des Controllers: ${error}`);
                connect_button.disabled = false;
                connect_button.textContent = "Verbinden";
            }
        });

        const play_button = speed_not_set_div.querySelector("#start_game");
        play_button.addEventListener("click", () => {
            ready();
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
                if (instruction === commands.connected) controller_started();
                else instructions_to_execute.push(instruction);
            }
        });


        if (instruction.includes(commands.speed) && instruction.includes(commands.speed_end)) {
            const speed = Number(instruction.replace(commands.speed, "").replace(commands.speed_end, ""));

            if (Number.isFinite(speed) && speed >= 0 && speed <= 100) {
                updateSpeed(speed);
            }
        }
    });
};

const controller_started = () => {
    controller_not_started_div.classList.add("hidden");
    speed_not_set_div.classList.remove("hidden");
};

const ready = () => {
    connect_controller.remove();
    stm32_ready = 1;
};
