import * as borsh from 'borsh';

export class GreetingAccount {
    counter = 0;
    highest_trans=0;
    constructor(fields: {counter: number,highest_trans:number} | undefined = undefined) {
      if (fields) {
        this.counter = fields.counter;
        this.highest_trans = fields.highest_trans;
      }
    }
  }
  
export const GreetingSchema = new Map([
    [GreetingAccount, {kind: 'struct', fields: [['counter', 'u32'],['highest_trans','u64']]}],
  ]);
  
export const GREETING_SIZE = borsh.serialize(
    GreetingSchema,
    new GreetingAccount(),
  ).length;

