import { initSimnet } from "@hirosystems/clarinet-sdk";
import { Cl, cvToValue } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

enum ErrCode {
  ERR_UNAUTHORIZED = 1000,
  ERR_INVALID_PARAMS,
  ERR_NAME_ALREADY_USED,
  ERR_SAVING_RESOURCE_DATA,
  ERR_DELETING_RESOURCE_DATA,
  ERR_RESOURCE_NOT_FOUND,
  ERR_USER_ALREADY_EXISTS,
  ERR_SAVING_USER_DATA,
  ERR_USER_NOT_FOUND,
  ERR_INVOICE_ALREADY_PAID,
  ERR_SAVING_INVOICE_DATA,
  ERR_INVOICE_HASH_NOT_FOUND,
  ERR_SETTING_MEMO_ON_TRANSFER,
}

const createResource = (name: string, desc: string, price: number) => {
  return [Cl.stringUtf8(name), Cl.stringUtf8(desc), Cl.uint(price)];
};

const defaultPrice = 1_000_000; // 1 STX

const testResource = [
  Cl.stringUtf8("Bitcoin Face"),
  Cl.stringUtf8("Generate a unique Bitcoin face."),
  Cl.uint(defaultPrice),
];

// based on hex value printed to console in first run
// curious to see if this is the same every time
// before we have a local function to compute the same data
// (some 0x053637c68fd20a0bdeef9712f0eb6c2b5c041a7f0ee6a6aed601267c25a39cb6)
// const expectedBlock0Resource0 = Buffer.from("053637c68fd20a0bdeef9712f0eb6c2b5c041a7f0ee6a6aed601267c25a39cb6", "hex")
// incremented resource count (and others) to start at 1
// (some 0x38bc32acb79a15b7a0b04f4268eba0c5be61d17e0629aac508da25d8884b017e)
// changed hashing algorithm, now composed of: resource name, contract name, stacks block hash, bitcoin block hash, user pubkey
// (some 0x520b34a624e73b0533db4475f260febb048e7eb150f8773779b9fd9dab85d652)
// (some 0xffc41d187c6b7bdd89fec3b4cdf967f7ab81d1efb3358cee6df8f08c9d1c76e9)
const expectedBlock0Resource1 = Buffer.from(
  "ffc41d187c6b7bdd89fec3b4cdf967f7ab81d1efb3358cee6df8f08c9d1c76e9",
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

describe("Deleting a Resource", () => {
  it("delete-resource() fails if not called by deployer", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource",
      [Cl.uint(1)],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("delete-resource() fails if provided index is greater than current resource count", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("delete-resource() fails if executed twice on the same resource", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource again
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(
      Cl.uint(ErrCode.ERR_DELETING_RESOURCE_DATA)
    );
  });

  it("delete-resource-by-name() fails if not called by deployer", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource-by-name",
      [Cl.stringUtf8("Bitcoin Face")],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("delete-resource-by-name() fails if provided name is not found", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource-by-name",
      [Cl.stringUtf8("Nothingburger")],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID_PARAMS));
  });

  it("pay-invoice() fails for a deleted resource", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const deployer = accounts.get("deployer")!;
    // ACT
    // create resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // delete resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "delete-resource",
      [Cl.uint(1)],
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // pay invoice
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
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_RESOURCE_NOT_FOUND));
  });
});

describe("Setting a Payment Address", () => {
  it("set-payment-address() fails if not called by deployer", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    // get current payment address
    const currentPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const currentPaymentAddress = cvToValue(
      currentPaymentAddressResponse.result
    );
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "set-payment-address",
      [
        Cl.standardPrincipal(currentPaymentAddress.value),
        Cl.standardPrincipal(address1),
      ],
      address1
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("set-payment-address() fails if old address param is incorrect", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const deployer = accounts.get("deployer")!;
    // ACT
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "set-payment-address",
      [Cl.standardPrincipal(address1), Cl.standardPrincipal(address1)],
      deployer
    );
    // ASSERT
    expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
  });

  it("set-payment-address() succeeds if called by the deployer", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;

    // ACT
    // get current payment address
    const currentPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const currentPaymentAddress = cvToValue(
      currentPaymentAddressResponse.result
    );
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "set-payment-address",
      [
        Cl.standardPrincipal(currentPaymentAddress.value),
        Cl.standardPrincipal(address1),
      ],
      deployer
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.bool(true));
  });

  it("set-payment-address() succeeds if called by current payment address", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;

    // ACT
    // get current payment address
    const currentPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const currentPaymentAddress = cvToValue(
      currentPaymentAddressResponse.result
    );
    // set payment address
    const response = simnet.callPublicFn(
      "stacks-m2m-v1",
      "set-payment-address",
      [
        Cl.standardPrincipal(currentPaymentAddress.value),
        Cl.standardPrincipal(address1),
      ],
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // get current payment address again
    const updatedPaymentAddressResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-payment-address",
      [],
      address1
    );
    // parse into an object we can read
    const updatedPaymentAddress = cvToValue(
      updatedPaymentAddressResponse.result
    );
    // set payment address again
    const secondResponse = simnet.callPublicFn(
      "stacks-m2m-v1",
      "set-payment-address",
      [Cl.standardPrincipal(address1), Cl.standardPrincipal(address2)],
      address1
    );
    // ASSERT
    expect(updatedPaymentAddress.value).toEqual(address1);
    expect(response.result).toBeOk(Cl.bool(true));
    expect(secondResponse.result).toBeOk(Cl.bool(true));
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

  it("get-invoice-hash() succeeds and generates unique values for different users at different block heights", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const wallets = [deployer, address1, address2];

    // ACT
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // create an array of invoice hashes for 500 blocks
    const invoiceHashes = [];
    for (const wallet of wallets) {
      for (let i = 0; i < 500; i++) {
        const response = simnet.callReadOnlyFn(
          "stacks-m2m-v1",
          "get-invoice-hash",
          [
            Cl.standardPrincipal(wallet), // user
            Cl.uint(1), // resource index
            Cl.uint(i), // block height
          ],
          wallet
        );
        invoiceHashes.push(response.result);
      }
    }

    // ASSERT
    // check that each invoice hash is unique
    const uniqueInvoiceHashes = new Set(invoiceHashes);
    expect(uniqueInvoiceHashes.size).toEqual(invoiceHashes.length);
  });

  it("get-invoice-hash() succeeds and generates consistent values for different users at different block heights", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const deployer = accounts.get("deployer")!;
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const wallets = [deployer, address1, address2];

    // ACT
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // create an array of invoice hashes for 500 blocks
    const firstInvoiceHashes = [];
    for (const wallet of wallets) {
      for (let i = 0; i < 500; i++) {
        const response = simnet.callReadOnlyFn(
          "stacks-m2m-v1",
          "get-invoice-hash",
          [
            Cl.standardPrincipal(wallet), // user
            Cl.uint(1), // resource index
            Cl.uint(i), // block height
          ],
          wallet
        );
        firstInvoiceHashes.push(response.result);
      }
    }
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // create an array of invoice hashes for 500 blocks
    const secondInvoiceHashes = [];
    for (const wallet of wallets) {
      for (let i = 0; i < 500; i++) {
        const response = simnet.callReadOnlyFn(
          "stacks-m2m-v1",
          "get-invoice-hash",
          [
            Cl.standardPrincipal(wallet), // user
            Cl.uint(1), // resource index
            Cl.uint(i), // block height
          ],
          wallet
        );
        secondInvoiceHashes.push(response.result);
      }
    }

    // ASSERT
    // check that the arrays are equal
    expect(firstInvoiceHashes).toEqual(secondInvoiceHashes);
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

  it("pay-invoice() succeeds and updates resource and user data", async () => {
    // ARRANGE
    const simnet = await initSimnet();
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const deployer = accounts.get("deployer")!;
    const memo = Cl.none();
    // ACT
    // add a resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "add-resource",
      testResource,
      deployer
    );
    // pay invoice for resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        memo, // memo
      ],
      address1
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // pay invoice again for resource
    simnet.callPublicFn(
      "stacks-m2m-v1",
      "pay-invoice",
      [
        Cl.uint(1), // resource index
        memo, // memo
      ],
      address2
    );
    // progress the chain
    simnet.mineEmptyBlocks(5000);
    // get resource
    const resourceResponse = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-resource",
      [Cl.uint(1)],
      deployer
    );
    // get user
    const userResponseOne = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-user-data-by-address",
      [Cl.standardPrincipal(address1)],
      deployer
    );
    const userResponseTwo = simnet.callReadOnlyFn(
      "stacks-m2m-v1",
      "get-user-data-by-address",
      [Cl.standardPrincipal(address2)],
      deployer
    );
    // ASSERT
    expect(resourceResponse.result).toBeSome(
      Cl.tuple({
        createdAt: Cl.uint(2),
        description: Cl.stringUtf8("Generate a unique Bitcoin face."),
        name: Cl.stringUtf8("Bitcoin Face"),
        price: Cl.uint(defaultPrice),
        totalSpent: Cl.uint(defaultPrice * 2),
        totalUsed: Cl.uint(2),
      })
    );
    expect(userResponseOne.result).toBeSome(
      Cl.tuple({
        address: Cl.standardPrincipal(address1),
        totalSpent: Cl.uint(defaultPrice),
        totalUsed: Cl.uint(1),
      })
    );
    expect(userResponseTwo.result).toBeSome(
      Cl.tuple({
        address: Cl.standardPrincipal(address2),
        totalSpent: Cl.uint(defaultPrice),
        totalUsed: Cl.uint(1),
      })
    );
  });
});
