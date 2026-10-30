import "dotenv/config";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3333);
const app = createApp();

app.listen(port, "0.0.0.0", () => {
  console.log(`Central Cirúrgica API listening on port ${port}`);
});