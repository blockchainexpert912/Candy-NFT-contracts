/// This transaction is what an account would run
/// to link a collection to its public storage
/// after having configured its NFTForwarder

import NonFungibleToken from "NonFungibleToken"
import MetadataViews from "MetadataViews"
import CandyNFT from "CandyNFT"
import NFTForwarding from "NFTForwarding"

transaction {

    prepare(signer: AuthAccount) {
        if signer.getCapability(CandyNFT.CollectionPublicPath).check<&{CandyNFT.CandyNFTCollectionPublic}>() {
            log("Collection already configured for PublicPath")
            return
        }

        if signer.getCapability(CandyNFT.CollectionPublicPath).check<&{NonFungibleToken.Receiver}>() {
            log("Unlinking NFTForwarder from PublicPath")
            signer.unlink(CandyNFT.CollectionPublicPath)
        }

        // create a public capability for the collection
        signer.link<&{NonFungibleToken.CollectionPublic, CandyNFT.CandyNFTCollectionPublic, MetadataViews.ResolverCollection}>(
            CandyNFT.CollectionPublicPath,
            target: CandyNFT.CollectionStoragePath
        )
    }
}
