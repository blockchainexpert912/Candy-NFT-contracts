import path from "path";
import { expect } from "@jest/globals";
import {
    emulator,
    getAccountAddress,
    init,
    sendTransaction,
    shallPass,
    shallRevert,
} from "@onflow/flow-js-testing";
import { deployContracts } from "../templates/deploy_templates";
import {
    mintNFT,
    setupAccountNFTCollection,
    setupForwarding,
} from "../templates/transaction_templates";
import { assertCollectionLength } from "../templates/assertion_templates";

// Set basepath of the project
const BASE_PATH = path.resolve(__dirname, "./../../../../");

describe("NFTForwarding Contract Tests", () => {

    // Setup each test
    beforeEach(async () => {
        const logging = false;

        await init(BASE_PATH);
        return emulator.start({ logging });
    });

    // Stop the emulator after each test
    afterEach(async () => {
        return emulator.stop();
    })

    // Deploy contracts & test forwarding
    test("Should forward NFT to designated forwarding recipient", async () => {

        // Deploy all contracts
        const {
            _,
            CandyNFTAccount,
            forwarderAccount,
            recipientAccount,
            thirdPartyAccount,
            contractParams
        } = await getTestAddressesAndContractParams();
        await deployContracts(contractParams);

        // Setup accounts with CandyNFT collections
        await setupAccountNFTCollection(
            [ thirdPartyAccount, forwarderAccount, recipientAccount ]
        );

        // Mint NFT from CandyNFTAccount and send to thirdPartyAccount
        await mintNFT(CandyNFTAccount, thirdPartyAccount);

        // Setup forwarding from forwarderAccount to recipientAccount
        await setupForwarding(forwarderAccount, recipientAccount);

        // Transfer NFT from thirdPartyAccount to forwarderAccount
        await shallPass(
            sendTransaction(
                "NFTForwarding/transfer_nft_to_receiver",
                [ thirdPartyAccount ],
                [ forwarderAccount, "0" ]
            )
        );

        // Make sure the NFT is in the forwarding recipient account and no other
        // following the path of thirdPartyAccount -> forwarderAccount -> recipientAccount
        // with a single transfer transaction
        await assertCollectionLength(thirdPartyAccount, 0);
        await assertCollectionLength(recipientAccount, 1);

    });

    test("Setup then change forwarding recipient", async () => {
        // Deploy all contracts
        const {
            _,
            CandyNFTAccount,
            forwarderAccount,
            recipientAccount,
            thirdPartyAccount,
            contractParams
        } = await getTestAddressesAndContractParams();
        await deployContracts(contractParams);

        // Setup accounts with CandyNFT collections
        await setupAccountNFTCollection(
            [CandyNFTAccount, thirdPartyAccount, forwarderAccount, recipientAccount]
        );

        // Mint NFT from CandyNFTAccount and send to thirdPartyAccount
        await mintNFT(CandyNFTAccount, thirdPartyAccount);

        // Setup forwarding from forwarderAccount to recipientAccount
        await setupForwarding(forwarderAccount, recipientAccount);

        // Change forwarding recipient to be CandyNFTAccount
        await shallPass(
            sendTransaction(
                "NFTForwarding/change_forwarder_recipient",
                [ forwarderAccount ],
                [ CandyNFTAccount ]
            )
        );

        // Transfer NFT to forwarderAccount
        await shallPass(
            sendTransaction(
                "NFTForwarding/transfer_nft_to_receiver",
                [ thirdPartyAccount ],
                [ forwarderAccount, "0" ]
            )
        );
        // Verify NFT is now in CandyNFTAccount's collection
        await assertCollectionLength(thirdPartyAccount, 0);
        await assertCollectionLength(CandyNFTAccount, 1);
    });

    test("Setup NFTForwarder then unlink recipient's collection. Forwarding should fail.", async () => {

        // Deploy all contracts
        const {
            _,
            CandyNFTAccount,
            forwarderAccount,
            recipientAccount,
            thirdPartyAccount,
            contractParams
        } = await getTestAddressesAndContractParams();
        await deployContracts(contractParams);

        // Setup accounts with CandyNFT collections
        await setupAccountNFTCollection(
            [CandyNFTAccount, thirdPartyAccount, forwarderAccount, recipientAccount]
        );

        // Mint NFT from CandyNFTAccount and send to thirdPartyAccount
        await mintNFT(CandyNFTAccount, thirdPartyAccount);

        // Setup forwarding from forwarderAccount to recipientAccount
        await setupForwarding(forwarderAccount, recipientAccount);

        // Unlink collection in recipientAccount
        await shallPass(
            sendTransaction("unlink_collection", [recipientAccount], [ ])
        );

        // Transfer NFT, but attempt to forward should fail
        const [txn, err] = await shallRevert(
            sendTransaction(
                "NFTForwarding/transfer_nft_to_receiver",
                [thirdPartyAccount],
                [forwarderAccount, "1"]
            )
        );

        // Check that transaction reverted due to missing NFT
        expect(txn).toBeNull();
        expect(err.toString()).toEqual(
            expect.stringMatching(/missing NFT/)
        );

        // NFT should still be in thirdPartyAccount's collection
        await assertCollectionLength(thirdPartyAccount, 1);

    });

    test("Setup NFTForwarder then unlink and restore collection in forwarder's account", async () => {
        // Deploy all contracts
        const {
            _,
            CandyNFTAccount,
            forwarderAccount,
            recipientAccount,
            thirdPartyAccount,
            contractParams
        } = await getTestAddressesAndContractParams();
        await deployContracts(contractParams);

        // Setup accounts with CandyNFT collections
        await setupAccountNFTCollection(
            [CandyNFTAccount, thirdPartyAccount, forwarderAccount, recipientAccount]
        );

        // Mint NFT from CandyNFTAccount and send to thirdPartyAccount
        await mintNFT(CandyNFTAccount, thirdPartyAccount);

        // Setup forwarding from forwarderAccount to recipientAccount
        await setupForwarding(forwarderAccount, recipientAccount);

        // Unlink forwarding & restore link to collection
        await shallPass(
            sendTransaction(
                "NFTForwarding/unlink_forwarder_link_collection",
                [forwarderAccount],
                [ ]
            )
        );

        // Transfer NFT to forwarderAccount
        await shallPass(
            sendTransaction(
                "transfer_nft",
                [thirdPartyAccount],
                [forwarderAccount, "0"]
            )
        );

        // Verify NFT is now in forwarderAccount's collection
        await assertCollectionLength(thirdPartyAccount, 0);
        await assertCollectionLength(forwarderAccount, 1);
    });
});

// Generate accounts and contract deployment parameters for each account
// relevant to the above test cases
async function getTestAddressesAndContractParams() {
    const _nftAccount = await getAccountAddress("NFTAddress");
    const _CandyNFTAccount = await getAccountAddress("CandyNFTAddress");
    const _forwarderAccount = await getAccountAddress("ForwarderAddress");
    const _recipientAccount = await getAccountAddress("RecipientAddress");
    const _thirdPartyAccount = await getAccountAddress("ThirdPartyAddress");
    const _resolverAccount = await getAccountAddress("ViewResolver");

    const _contractParams = [{
            to: _nftAccount,
            name: "NonFungibleToken"
        }, {
            to: _resolverAccount,
            name: "ViewResolver"
        }, {
            to: _nftAccount,
            name: "MetadataViews"
        }, {
            to: _CandyNFTAccount,
            name: "CandyNFT"
        }, {
            to: _forwarderAccount,
            name: "utility/NFTForwarding"
    }];

    return {
        nftAccount: _nftAccount,
        CandyNFTAccount: _CandyNFTAccount,
        forwarderAccount: _forwarderAccount,
        recipientAccount: _recipientAccount,
        thirdPartyAccount: _thirdPartyAccount,
        contractParams: _contractParams,
        resolverAccount: _resolverAccount
    };
};
