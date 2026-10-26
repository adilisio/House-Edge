import act1 from "./act1.ink";
import { runAct } from "./player";
import { SAVE_KEYS } from "./saves";

runAct({ json: act1, saveKey: SAVE_KEYS.act1 });
