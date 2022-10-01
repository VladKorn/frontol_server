import { deleteTrigger, createTrigger, addColl } from "./tools";
(async () => {
	await deleteTrigger();
	await createTrigger();
	await addColl();
	console.log("ok");
})();
