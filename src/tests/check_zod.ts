
import { z } from "zod";

try {
  console.log("z.iso:", z.iso);
  console.log("z.iso.date:", z.iso?.date);
} catch (e) {
  console.error(e);
}
