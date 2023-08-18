/// This transaction is what an account would run
/// to set itself up to receive NFTs

import NonFungibleToken from "NonFungibleToken"
import CandyNFT from "CandyNFT"
import MetadataViews from "MetadataViews"

transaction {

    prepare(signer: AuthAccount) {
        // Return early if the account already has a collection
        if signer.borrow<&CandyNFT.Collection>(from: CandyNFT.CollectionStoragePath) != nil {
            return
        }

        // Create a new empty collection
        let collection <- CandyNFT.createEmptyCollection()

        // save it to the account
        signer.save(<-collection, to: CandyNFT.CollectionStoragePath)

        // create a public capability for the collection
        signer.link<&{NonFungibleToken.CollectionPublic, CandyNFT.CandyNFTCollectionPublic, MetadataViews.ResolverCollection}>(
            CandyNFT.CollectionPublicPath,
            target: CandyNFT.CollectionStoragePath
        )
    }
}
