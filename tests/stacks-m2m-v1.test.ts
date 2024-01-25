import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

enum ErrCode {
  ERR_UNAUTHORIZED = 1000,
  ERR_INVALID_PARAMS,
  ERR_NAME_ALREADY_USED,
  ERR_SAVING_RESOURCE_DATA,
  ERR_DELETING_RESOURCE_DATA,
  ERR_RESOURCE_NOT_FOUND,
  ERR_SAVING_USER_DATA,
  ERR_SAVING_INVOICE,
  ERR_INVOICE_HASH_NOT_FOUND,
}

const createResource = (name: string, desc: string, price: number) => {
  return [Cl.stringUtf8(name), Cl.stringUtf8(desc), Cl.uint(price)];
};

const defaultPrice = 1_000_000; // 1 STX

const testResource = [
  Cl.stringUtf8("Test Resource 1"),
  Cl.stringUtf8("Used for initial testing."),
  Cl.uint(defaultPrice),
];

// based on hex value printed to console in first run
// curious to see if this is the same every time
// before we have a local function to compute the same data
// (some 0x053637c68fd20a0bdeef9712f0eb6c2b5c041a7f0ee6a6aed601267c25a39cb6)
// const expectedBlock0Resource0 = Buffer.from("053637c68fd20a0bdeef9712f0eb6c2b5c041a7f0ee6a6aed601267c25a39cb6", "hex")
// incremented resource count (and others) to start at 1
// (some 0x38bc32acb79a15b7a0b04f4268eba0c5be61d17e0629aac508da25d8884b017e)
const expectedBlock0Resource1 = Buffer.from(
  "38bc32acb79a15b7a0b04f4268eba0c5be61d17e0629aac508da25d8884b017e",
  "hex"
);

describe("Adding a resource", () => {
  it("add-resource() fails if not called by deployer", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });
  it("add-resource() fails if name is blank", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      createResource("", "description", defaultPrice),
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("add-resource() fails if description is blank", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      createResource("name", "", defaultPrice),
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("add-resource() fails if price is 0", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      createResource("name", "description", 0),
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });
  it("add-resource() fails if name already used", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const expectedCount = 1;
    // ACT
    const firstResponse = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    const secondResponse = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // ASSERT
    expect(firstResponse.result).toBeOk(Cl.uint(expectedCount));
    expect(secondResponse.result).toBeErr(
      Cl.uint(ErrCode.ERR_NAME_ALREADY_USED)
    );
  });

  it("add-resource() succeeds and increments resource count", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const expectedCount = 1;
    // ACT
    const oldCount = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-total-resources",
      [],
      deployer
    );
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    const newCount = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-total-resources",
      [],
      deployer
    );
    // ASSERT
    expect(oldCount.result).toBeUint(expectedCount - 1);
    expect(response.result).toBeOk(Cl.uint(expectedCount));
    expect(newCount.result).toBeUint(expectedCount);
  });
});

describe("Generating an invoice hash", () => {
  it("get-invoice-hash() returns none if resource is not found", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-invoice-hash",
      [
        Cl.standardPrincipal(deployer), // user
        Cl.uint(0), // resource index
        Cl.uint(0), // block height
      ],
      deployer
    );
    // ASSERT
    expect(response.result).toBeNone();
  });

  it("get-invoice-hash() succeeds and returns the correct value", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    const response = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-invoice-hash",
      [
        Cl.standardPrincipal(deployer), // user
        Cl.uint(1), // resource index
        Cl.uint(0), // block height
      ],
      deployer
    );
    // ASSERT
    expect(response.result).toBeSome(Cl.buffer(expectedBlock0Resource1));
  });

  it("get-invoice-hash() succeeds and returns the correct value after the chain progresses", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    simnet.mineEmptyBlocks(5000);
    const response = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-invoice-hash",
      [
        Cl.standardPrincipal(deployer), // user
        Cl.uint(1), // resource index
        Cl.uint(0), // block height
      ],
      deployer
    );
    // ASSERT
    expect(response.result).toBeSome(Cl.buffer(expectedBlock0Resource1));
  });
});

describe("Paying an invoice", () => {
  it("pay-invoice() fails if resource is not found", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "pay-invoice",
      [
        Cl.uint(0), // resource index
        Cl.none(), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND));
  });
  // not expecting ERR_USER_NOT_FOUND, not sure if we can force?
  // it("pay-invoice() fails if user cannot be created or found", async () => {})
  // not expecting ERR_INVOICE_HASH_NOT_FOUND, same as above
  // it("pay-invoice() fails if invoice hash cannot be found", async () => {})
  // not expecting ERR_SAVING_INVOICE in two spots, same as above
  // it("pay-invoice() fails if invoice cannot be saved", async () => {})
  it("pay-invoice() succeeds and returns invoice count without memo", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const expectedCount = 1;
    // ACT
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice for resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        Cl.none(), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.uint(expectedCount));
  });

  it("pay-invoice() succeeds and returns invoice count with memo", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const expectedCount = 1;
    const memo = Buffer.from("This is a memo test!");
    // ACT
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice for resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        Cl.some(Cl.buffer(memo)), // memo
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.uint(expectedCount));
  });

  it("pay-invoice() succeeds and returns invoice count with memo over several blocks", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const address3 = accounts.get("wallet_3")!;
    const expectedCount = 1;
    const memo = Cl.none();
    // ACT
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice once for 3 users
    const blockResponses = [
      simnet.callPublicFn(
        "stacks-m2m-v1",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address1
      ),
      simnet.callPublicFn(
        "stacks-m2m-v1",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address2
      ),
      simnet.callPublicFn(
        "stacks-m2m-v1",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address3
      ),
    ];
    // progress by 5000 blocks
    simnet.mineEmptyBlocks(5000);
    // pay invoice again for 3 users
    blockResponses.push(
      simnet.callPublicFn(
        "stacks-m2m-v1",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address1
      ),
      simnet.callPublicFn(
        "stacks-m2m-v1",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address2
      ),
      simnet.callPublicFn(
        "stacks-m2m-v1",
        "pay-invoice",
        [
          Cl.uint(1), // resource index
          memo, // memo
        ],
        address3
      )
    );
    // ASSERT
    for (let i = 0; i < blockResponses.length; i++) {
      expect(blockResponses[i].result).toBeOk(Cl.uint(expectedCount + i));
    }
  });
});
