package test

import (
	"testing"

	"github.com/onflow/cadence"
	jsoncdc "github.com/onflow/cadence/encoding/json"
	"github.com/onflow/cadence/runtime/common"
	"github.com/onflow/flow-emulator/adapters"
	"github.com/onflow/flow-emulator/emulator"
	"github.com/onflow/flow-go-sdk"
	"github.com/onflow/flow-go-sdk/crypto"
	"github.com/onflow/flow-go-sdk/test"
	"github.com/stretchr/testify/assert"

	"github.com/onflow/flow-nft/lib/go/contracts"
	"github.com/onflow/flow-nft/lib/go/templates"
)

// Mints a single NFT from the CandyNFT contract
// with standard metadata fields and royalty cuts
func mintCandyNFT(
	t *testing.T,
	b emulator.Emulator,
	accountKeys *test.AccountKeys,
	nftAddress, metadataAddress, CandyNFTAddress flow.Address,
	CandyNFTAccountKey *flow.AccountKey,
	CandyNFTSigner crypto.Signer,
) {

	// Create two new accounts to act as beneficiaries for royalties
	beneficiaryAddress1, _, beneficiarySigner1 := newAccountWithAddress(b, accountKeys)
	setupRoyaltyReceiver(t, b,
		metadataAddress,
		beneficiaryAddress1,
		beneficiarySigner1,
	)
	beneficiaryAddress2, _, beneficiarySigner2 := newAccountWithAddress(b, accountKeys)
	setupRoyaltyReceiver(t, b,
		metadataAddress,
		beneficiaryAddress2,
		beneficiarySigner2,
	)

	// Generate the script that mints a new NFT and deposits it into the recipient's account
	// whose address is the first argument to the transaction
	script := templates.GenerateMintNFTScript(nftAddress, CandyNFTAddress, metadataAddress, flow.HexToAddress(emulatorFTAddress))

	// Create the transaction object with the generated script and authorizer
	tx := createTxWithTemplateAndAuthorizer(b, script, CandyNFTAddress)

	// Assemble the cut information for royalties
	cut1 := CadenceUFix64("0.25")
	cut2 := CadenceUFix64("0.40")
	cuts := []cadence.Value{cut1, cut2}

	// Assemble the royalty description and beneficiary addresses to get their receivers
	royaltyDescriptions := []cadence.Value{cadence.String("Minter royalty"), cadence.String("Creator royalty")}
	royaltyBeneficiaries := []cadence.Value{cadence.NewAddress(beneficiaryAddress1), cadence.NewAddress(beneficiaryAddress2)}

	// First argument is the recipient of the newly minted NFT
	tx.AddArgument(cadence.NewAddress(CandyNFTAddress))
	tx.AddArgument(cadence.String("Candy NFT 0"))
	tx.AddArgument(cadence.String("This is an Candy NFT"))
	tx.AddArgument(cadence.String("Candy.jpeg"))
	tx.AddArgument(cadence.NewArray(cuts))
	tx.AddArgument(cadence.NewArray(royaltyDescriptions))
	tx.AddArgument(cadence.NewArray(royaltyBeneficiaries))

	serviceSigner, _ := b.ServiceKey().Signer()

	signAndSubmit(
		t, b, tx,
		[]flow.Address{
			b.ServiceKey().Address,
			CandyNFTAddress,
		},
		[]crypto.Signer{
			serviceSigner,
			CandyNFTSigner,
		},
		false,
	)
}

// Deploys the NonFungibleToken, MetadataViews, and CandyNFT contracts to new accounts
// and returns their addresses
func deployNFTContracts(
	t *testing.T,
	b emulator.Emulator,
	adapter *adapters.SDKAdapter,
	CandyNFTAccountKey *flow.AccountKey,
) (flow.Address, flow.Address, flow.Address, flow.Address) {

	nftAddress := deploy(t, b, adapter, "NonFungibleToken", contracts.NonFungibleToken())
	metadataAddress := deploy(t, b, adapter, "MetadataViews", contracts.MetadataViews(flow.HexToAddress(emulatorFTAddress), nftAddress))
	resolverAddress := deploy(t, b, adapter, "ViewResolver", contracts.Resolver())

	CandyNFTAddress := deploy(
		t, b, adapter,
		"CandyNFT",
		contracts.CandyNFT(nftAddress, metadataAddress, resolverAddress),
		CandyNFTAccountKey,
	)

	return nftAddress, metadataAddress, CandyNFTAddress, resolverAddress
}

// Assers that the CandyNFT collection in the specified user's account
// is the expected length
func assertCollectionLength(
	t *testing.T,
	b emulator.Emulator,
	nftAddress flow.Address, CandyNFTAddress flow.Address,
	collectionAddress flow.Address,
	expectedLength int,
) {
	script := templates.GenerateGetCollectionLengthScript(nftAddress, CandyNFTAddress)
	actualLength := executeScriptAndCheck(t, b, script, [][]byte{jsoncdc.MustEncode(cadence.NewAddress(collectionAddress))})
	assert.Equal(t, cadence.NewInt(expectedLength), actualLength)
}

// Sets up an account with the generic royalty receiver in place of their Flow token receiver
func setupRoyaltyReceiver(
	t *testing.T,
	b emulator.Emulator,
	metadataAddress flow.Address,
	authorizerAddress flow.Address,
	authorizerSigner crypto.Signer,
) {

	script := templates.GenerateSetupAccountToReceiveRoyaltyScript(metadataAddress, flow.HexToAddress(emulatorFTAddress))
	tx := createTxWithTemplateAndAuthorizer(b, script, authorizerAddress)

	vaultPath := cadence.Path{Domain: common.PathDomainStorage, Identifier: "flowTokenVault"}
	tx.AddArgument(vaultPath)

	serviceSigner, _ := b.ServiceKey().Signer()

	signAndSubmit(
		t, b, tx,
		[]flow.Address{
			b.ServiceKey().Address,
			authorizerAddress,
		},
		[]crypto.Signer{
			serviceSigner,
			authorizerSigner,
		},
		false,
	)
}
