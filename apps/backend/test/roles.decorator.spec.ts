import { Reflector } from "@nestjs/core";
import { describe, expect, it } from "vitest";
import { Roles } from "../src/modules/auth/decorators/roles.decorator.js";

class TestController {
  @Roles("OWNER", "ADMIN")
  securedMethod(): void {}
}

describe("Roles decorator", () => {
  it("attaches role metadata", () => {
    const reflector = new Reflector();
    const metadata = reflector.get("roles", TestController.prototype.securedMethod);

    expect(metadata).toEqual(["OWNER", "ADMIN"]);
  });
});
