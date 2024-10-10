import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const address3 = accounts.get("wallet_3")!;
const address4 = accounts.get("wallet_4")!;
const address5 = accounts.get("wallet_5")!;
const addressDeployer = accounts.get("deployer")!;

enum ErrCode {
  ERR_INVALID = 1000,
  ERR_UNAUTHORIZED = 1001,
  ERR_TOO_SOON = 1002,
}

const userList = [
  { user: address1, enabled: true },
  { user: address2, enabled: false },
  { user: address3, enabled: true },
  { user: address4, enabled: false },
  { user: address5, enabled: true },
];

const userListAlt = [
  { user: address1, enabled: false },
  { user: address2, enabled: true },
  { user: address3, enabled: false },
  { user: address4, enabled: true },
  { user: address5, enabled: false },
];

function setUserList(account: string, alt = false) {
  const list = alt ? userListAlt : userList;
  return simnet.callPublicFn(
    "aibtcdev-bank-account",
    "set-user-list",
    [
      Cl.list(
        list.map((u) =>
          Cl.tuple({
            user: Cl.principal(u.user),
            enabled: Cl.bool(u.enabled),
          })
        )
      ),
    ],
    account
  );
}

describe("aibtcdev-bank-account", () => {
  describe("set-withdrawal-period", () => {
    it("succeeds when deployer sets a valid period", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-withdrawal-period",
        [Cl.uint(200)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the period", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-withdrawal-period",
        [Cl.uint(200)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets an invalid period", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-withdrawal-period",
        [Cl.uint(0)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("set-withdrawal-amount", () => {
    it("succeeds when deployer sets a valid amount", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-withdrawal-amount",
        [Cl.uint(15000000)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the amount", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-withdrawal-amount",
        [Cl.uint(15000000)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets an invalid amount", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-withdrawal-amount",
        [Cl.uint(0)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("override-last-withdrawal-block", () => {
    it("succeeds when deployer sets a valid block height", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "override-last-withdrawal-block",
        [Cl.uint(500)],
        addressDeployer
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-deployer tries to set the block height", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "override-last-withdrawal-block",
        [Cl.uint(500)],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets an invalid block height", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "override-last-withdrawal-block",
        [Cl.uint(0)],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("set-user-list", () => {
    it("succeeds when deployer sets the user list", () => {
      const response = setUserList(addressDeployer);
      expect(response.result).toBeOk(
        Cl.list(userList.map((u) => Cl.ok(Cl.bool(u.enabled))))
      );
    });

    it("succeeds when deployer sets a user list the second time", () => {
      const response1 = setUserList(addressDeployer);
      const response2 = setUserList(addressDeployer, true);
      expect(response1.result).toBeOk(
        Cl.list(userList.map((u) => Cl.ok(Cl.bool(u.enabled))))
      );
      expect(response2.result).toBeOk(
        Cl.list(userListAlt.map((u) => Cl.ok(Cl.bool(u.enabled))))
      );
    });

    it("fails when a non-deployer tries to set the user list", () => {
      const response = setUserList(address1);
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when deployer sets the user list with an empty list", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-user-list",
        [Cl.list([])],
        addressDeployer
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_INVALID));
    });
  });

  describe("deposit-stx", () => {
    it("succeeds when user deposits STX into the contract", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "deposit-stx",
        [Cl.uint(10000000)],
        address1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });
  });

  describe("withdraw-stx", () => {
    it("succeeds when an authorized user withdraws STX", () => {
      // arrange
      simnet.callPublicFn(
        "aibtcdev-bank-account",
        "deposit-stx",
        [Cl.uint(100000000)],
        address1
      );
      setUserList(addressDeployer);
      simnet.mineEmptyBlocks(200);
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "withdraw-stx",
        [],
        address1
      );
      expect(response.result).toBeOk(Cl.bool(true));
    });

    it("fails when a non-authorized user tries to withdraw", () => {
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "withdraw-stx",
        [],
        address2
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
    });

    it("fails when the user tries to withdraw too soon", () => {
      setUserList(addressDeployer);
      simnet.callPublicFn(
        "aibtcdev-bank-account",
        "override-last-withdrawal-block",
        [Cl.uint(simnet.blockHeight)],
        addressDeployer
      );
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "withdraw-stx",
        [],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_TOO_SOON));
    });
  });

  describe("get-account-balance", () => {
    it("succeeds and returns the contract balance", () => {
      const response = simnet.callReadOnlyFn(
        "aibtcdev-bank-account",
        "get-account-balance",
        [],
        addressDeployer
      );
      expect(response.result).toBeUint(0);
    });

    it("succeeds and returns the contract balance after deposit", () => {
      simnet.callPublicFn(
        "aibtcdev-bank-account",
        "deposit-stx",
        [Cl.uint(100000000)],
        address1
      );
      const response = simnet.callReadOnlyFn(
        "aibtcdev-bank-account",
        "get-account-balance",
        [],
        addressDeployer
      );
      expect(response.result).toBeUint(100000000);
    });
  });

  describe("get-standard-caller", () => {
    it("succeeds and returns the caller", () => {
      const response = simnet.callReadOnlyFn(
        "aibtcdev-bank-account",
        "get-standard-caller",
        [],
        address1
      );
      expect(response.result).toBePrincipal(address1);
    });

    it("succeeds and returns the caller with a proxy", () => {
      const response = simnet.callPublicFn(
        "test-proxy",
        "get-standard-caller",
        [],
        address1
      );
      expect(response.result).toBeOk(Cl.principal(addressDeployer));
    });
  });
});
