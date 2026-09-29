// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {PayrollManagerBase} from "../../base/PayrollManagerBase.t.sol";

/// Regression: pending salary is tracked per funded cycle, so payroll set up with
/// single `addEmployee` calls — and every recurring cycle after the first — can be
/// disbursed. Before the fix, PayVault.credit() reverted with
/// PayrollManager__InsufficientPendingSalary and the cycle's funds were stuck.
contract PayrollManagerPendingSalaryTest is PayrollManagerBase {
    function _payday(uint256 cycleId) internal {
        vm.warp(router.getCycle(employer, cycleId).payDay);
        vm.prank(agentOperator);
        router.agentRebalance(employer, cycleId);
    }

    function test_addEmployee_cycleDisburses() public {
        uint256 groupId = _setupGroupWithActiveCycle();
        assertEq(manager.getEmployeeTotalPendingSalary(employee), EMPLOYEE_SALARY);

        _payday(1);
        assertEq(vault.getBalance(employee), EMPLOYEE_SALARY);
        assertEq(manager.getEmployeeTotalPendingSalary(employee), 0);
        assertFalse(manager.hasActiveGroup(employer, groupId));
    }

    function test_recurringCycles_disburse() public {
        uint256 groupId = _setupGroupWithActiveCycle();
        _payday(1);

        vm.prank(employer);
        manager.depositPayroll(groupId);
        assertEq(manager.getEmployeeTotalPendingSalary(employee), EMPLOYEE_SALARY);

        _payday(2);
        assertEq(vault.getBalance(employee), EMPLOYEE_SALARY * 2);
        assertEq(manager.getEmployeeTotalPendingSalary(employee), 0);
    }

    function test_cancelCycle_releasesPendingSalary() public {
        uint256 groupId = _setupGroupWithActiveCycle();
        vm.prank(employer);
        manager.cancelCycle(groupId);
        assertEq(manager.getEmployeeTotalPendingSalary(employee), 0);
    }
}
