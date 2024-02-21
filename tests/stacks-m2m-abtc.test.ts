import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

enum ErrCode {
  ERR_NOT_AUTHORIZED = 1000,
}

const FAUCET_DRIP = 10_000; // 0.0001 BTC
const FAUCET_DROP = 1_000_000; // 0.01 BTC
const FAUCET_FLOOD = 100_000_000; // 1 BTC

describe("stacks-m2m-abtc", () => {
  // faucet drip
  it(`faucet-drip(): succeeds and mints ${FAUCET_DRIP} aBTC`, () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-drip",
      [Cl.principal(address1)],
      address1
    );
    const balance = simnet.callReadOnlyFn(
      "stacks-m2m-abtc",
      "get-balance",
      [Cl.principal(address1)],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.bool(true));
    expect(balance.result).toBeOk(Cl.uint(FAUCET_DRIP));
  });
  // faucet drop
  it(`faucet-drop(): succeeds and mints ${FAUCET_DROP} aBTC`, () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-drop",
      [Cl.principal(address1)],
      address1
    );
    const balance = simnet.callReadOnlyFn(
      "stacks-m2m-abtc",
      "get-balance",
      [Cl.principal(address1)],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.bool(true));
    expect(balance.result).toBeOk(Cl.uint(FAUCET_DROP));
  });
  // faucet flood
  it(`faucet-flood(): succeeds and mints ${FAUCET_FLOOD} aBTC`, () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    // ACT
    const response = simnet.callPublicFn(
      "stacks-m2m-abtc",
      "faucet-flood",
      [Cl.principal(address1)],
      address1
    );
    const balance = simnet.callReadOnlyFn(
      "stacks-m2m-abtc",
      "get-balance",
      [Cl.principal(address1)],
      address1
    );
    // ASSERT
    expect(response.result).toBeOk(Cl.bool(true));
    expect(balance.result).toBeOk(Cl.uint(FAUCET_FLOOD));
  });
  // transfer works
  it("transfer(): succeeds and transfers aBTC between accounts", () => {
    // ARRANGE
    const accounts = simnet.getAccounts();
    const address1 = accounts.get("wallet_1")!;
    const address2 = accounts.get("wallet_2")!;
    const address3 = accounts.get("wallet_3")!;

    const funding = [
      simnet.callPublicFn(
        "stacks-m2m-abtc",
        "faucet-flood",
        [Cl.principal(address1)],
        address1
      ),
      simnet.callPublicFn(
        "stacks-m2m-abtc",
        "faucet-flood",
        [Cl.principal(address2)],
        address2
      ),
      simnet.callPublicFn(
        "stacks-m2m-abtc",
        "faucet-flood",
        [Cl.principal(address3)],
        address3
      ),
    ];
    // ACT

    // xfer from 1 to 2
    const transfer1 = simnet.callPublicFn(
      "stacks-m2m-abtc",
      "transfer",
      [
        Cl.uint(FAUCET_DRIP),
        Cl.principal(address1),
        Cl.principal(address2),
        Cl.none(),
      ],
      address1
    );
    // xfer from 2 to 3
    const transfer2 = simnet.callPublicFn(
      "stacks-m2m-abtc",
      "transfer",
      [
        Cl.uint(FAUCET_DROP),
        Cl.principal(address2),
        Cl.principal(address3),
        Cl.none(),
      ],
      address2
    );
    // xfer from 3 to 1
    const transfer3 = simnet.callPublicFn(
      "stacks-m2m-abtc",
      "transfer",
      [
        Cl.uint(FAUCET_FLOOD),
        Cl.principal(address3),
        Cl.principal(address1),
        Cl.none(),
      ],
      address3
    );

    // get balances
    const balance1 = simnet.callReadOnlyFn(
      "stacks-m2m-abtc",
      "get-balance",
      [Cl.principal(address1)],
      address1
    );
    const balance2 = simnet.callReadOnlyFn(
      "stacks-m2m-abtc",
      "get-balance",
      [Cl.principal(address2)],
      address1
    );
    const balance3 = simnet.callReadOnlyFn(
      "stacks-m2m-abtc",
      "get-balance",
      [Cl.principal(address3)],
      address1
    );

    // ASSERT
    for (const response of funding) {
      expect(response.result).toBeOk(Cl.bool(true));
    }
    expect(transfer1.result).toBeOk(Cl.bool(true));
    expect(transfer2.result).toBeOk(Cl.bool(true));
    expect(transfer3.result).toBeOk(Cl.bool(true));
    // Minted - Sent Amount + Received Amount
    expect(balance1.result).toBeOk(
      Cl.uint(FAUCET_FLOOD - FAUCET_DRIP + FAUCET_FLOOD)
    );
    expect(balance2.result).toBeOk(
      Cl.uint(FAUCET_FLOOD - FAUCET_DROP + FAUCET_DRIP)
    );
    expect(balance3.result).toBeOk(
      Cl.uint(FAUCET_FLOOD - FAUCET_FLOOD + FAUCET_DROP)
    );
  });
});
