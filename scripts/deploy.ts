// scripts/deploy.ts
import { ethers, upgrades } from "hardhat";

async function main() {
    // Get the contract factory
    const NSPointsFactory = await ethers.getContractFactory("NSPOINTS");

    // Deploy as upgradeable contract
    const nsPoints = await upgrades.deployProxy(NSPointsFactory, [], {
        initializer: 'initialize',
    });

    // Wait for deployment to complete
    await nsPoints.waitForDeployment();

    // Get the deployed address
    const address = await nsPoints.getAddress();
    console.log("NSPOINTS proxy deployed to:", address);

    // Get implementation address
    const implementationAddress = await upgrades.erc1967.getImplementationAddress(address);
    console.log("NSPOINTS implementation deployed to:", implementationAddress);
}

// Handle errors in deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
