package templates

import (
	"regexp"

	"github.com/onflow/flow-go-sdk"
)

//go:generate go run github.com/kevinburke/go-bindata/go-bindata -prefix ../../../ -o internal/assets/assets.go -pkg assets -nometadata -nomemcopy ../../../scripts/... ../../../transactions/...

var (
	placeholderNonFungibleToken = regexp.MustCompile(`"NonFungibleToken"`)
	placeholderCandyNFT       = regexp.MustCompile(`"CandyNFT"`)
	placeholderMetadataViews    = regexp.MustCompile(`"MetadataViews"`)
	placeholderFungibleToken    = regexp.MustCompile(`"FungibleToken"`)
)

func replaceAddresses(code string, nftAddress, CandyNFTAddress, metadataAddress, ftAddress flow.Address) []byte {
	code = placeholderNonFungibleToken.ReplaceAllString(code, "0x"+nftAddress.String())
	code = placeholderCandyNFT.ReplaceAllString(code, "0x"+CandyNFTAddress.String())
	code = placeholderMetadataViews.ReplaceAllString(code, "0x"+metadataAddress.String())
	code = placeholderFungibleToken.ReplaceAllString(code, "0x"+ftAddress.String())
	return []byte(code)
}
