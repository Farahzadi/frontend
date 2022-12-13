import NonceIncreasement from "../NonceIncreasement/NonceIncreasement";
import Allowance from "./Allowance";

export class SecurityComp {
    static Allowance = new SecurityComp(Allowance);
    static Nonce = new SecurityComp(NonceIncreasement);

    constructor(comp) {
        this.component = comp;

    }
}