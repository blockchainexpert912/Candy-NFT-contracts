/// This script resolves all the supported views from
/// the CandyNFT contract. Used for testing only.

import CandyNFT from "CandyNFT"
import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"

pub fun main(): Bool {
    // Call `resolveView` with invalid Type
    let view = CandyNFT.resolveView(Type<String>())
    assert(nil == view)

    let collectionDisplay = (CandyNFT.resolveView(
        Type<MetadataViews.NFTCollectionDisplay>()
    )as! MetadataViews.NFTCollectionDisplay?)!

    assert("The Candy Collection" == collectionDisplay.name)
    assert("This collection is used as an Candy to help you develop your next Flow NFT." == collectionDisplay.description)
    assert("https://Candy-nft.onflow.org" == collectionDisplay.externalURL!.url)
    assert("https://twitter.com/flow_blockchain" == collectionDisplay.socials["twitter"]!.url)
    assert("https://assets.website-files.com/5f6294c0c7a8cdd643b1c820/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.svg" == collectionDisplay.squareImage.file.uri())
    assert("https://assets.website-files.com/5f6294c0c7a8cdd643b1c820/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.svg" == collectionDisplay.bannerImage.file.uri())

    let collectionData = (CandyNFT.resolveView(
        Type<MetadataViews.NFTCollectionData>()
    ) as! MetadataViews.NFTCollectionData?)!

    assert(CandyNFT.CollectionStoragePath == collectionData.storagePath)
    assert(CandyNFT.CollectionPublicPath == collectionData.publicPath)
    assert(/private/CandyNFTCollection == collectionData.providerPath)
    assert(Type<&CandyNFT.Collection{CandyNFT.CandyNFTCollectionPublic}>() == collectionData.publicCollection)
    assert(Type<&CandyNFT.Collection{CandyNFT.CandyNFTCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>() == collectionData.publicLinkedType)
    assert(Type<&CandyNFT.Collection{CandyNFT.CandyNFTCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>() == collectionData.providerLinkedType)

    let coll <- collectionData.createEmptyCollection()
    assert(0 == coll.getIDs().length)

    destroy <- coll

    return true
}
