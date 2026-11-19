import assert from "node:assert/strict";
import { calculateBudget } from "../public/marketplace/buyer-budget.mjs";

// Use the agreed/accepted quantity, as entered in the current buyer calculator.
const values = {budget:"50000", quantity:"950", price:"25", transport:"1000", labour:"0", loading:"0", toll:"0", phone:"0", other:"0"};
const result = calculateBudget(values);
assert.equal(result.potatoes, 23750);
assert.equal(result.total, 24750);
assert.equal(result.unitCost, 26.05);
assert.equal(calculateBudget({...values, transport:""}).total, null);
assert.equal(calculateBudget({...values, transport:null}).total, null);
assert.equal(calculateBudget({...values, transport:"0"}).total, 23750);
assert.equal(result.profit, null);
console.log("marketplace money rules passed");
