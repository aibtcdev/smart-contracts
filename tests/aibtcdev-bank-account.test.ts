import { Cl } from "@stacks/transactions";
import { describe, expect, it } from "vitest";

const accounts = simnet.getAccounts();
const address1 = accounts.get("wallet_1")!;
const address2 = accounts.get("wallet_2")!;
const addressDeployer = accounts.get("deployer")!;

enum ErrCode {
  ERR_INVALID = 1000,
  ERR_UNAUTHORIZED = 1001,
  ERR_TOO_SOON = 1002,
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
  });

  describe("set-user-list", () => {
    it("succeeds when deployer sets the user list", () => {
      const userList = [
        { user: address1, enabled: true },
        { user: address2, enabled: false },
      ];
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-user-list",
        [
          Cl.list(
            userList.map((u) =>
              Cl.tuple({
                user: Cl.principal(u.user),
                enabled: Cl.bool(u.enabled),
              })
            )
          ),
        ],
        addressDeployer
      );
      expect(response.result).toBeOk(
        Cl.list(userList.map((u) => Cl.ok(Cl.bool(u.enabled))))
      );
    });

    it("fails when a non-deployer tries to set the user list", () => {
      const userList = [
        { user: address1, enabled: true },
        { user: address2, enabled: false },
      ];
      const response = simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-user-list",
        [
          Cl.list(
            userList.map((u) =>
              Cl.tuple({
                user: Cl.principal(u.user),
                enabled: Cl.bool(u.enabled),
              })
            )
          ),
        ],
        address1
      );
      expect(response.result).toBeErr(Cl.uint(ErrCode.ERR_UNAUTHORIZED));
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
      simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-user-list",
        [
          Cl.list(
            [{ user: address1, enabled: true }].map((u) =>
              Cl.tuple({
                user: Cl.principal(u.user),
                enabled: Cl.bool(u.enabled),
              })
            )
          ),
        ],
        addressDeployer
      );
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
      simnet.callPublicFn(
        "aibtcdev-bank-account",
        "set-user-list",
        [
          Cl.list(
            [{ user: address1, enabled: true }].map((u) =>
              Cl.tuple({
                user: Cl.principal(u.user),
                enabled: Cl.bool(u.enabled),
              })
            )
          ),
        ],
        addressDeployer
      );
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
});
