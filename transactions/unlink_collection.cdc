/// This transaction is what an account would run
/// to unlink its collection from public storage

import NonFungibleToken from "NonFungibleToken"
import CandyNFT from "CandyNFT"
import NFTForwarding from "NFTForwarding"

transaction {

    prepare(signer: AuthAccount) {

        if signer.getCapability(CandyNFT.CollectionPublicPath).check<&{CandyNFT.CandyNFTCollectionPublic}>() {
            log("Unlinking CandyNFTCollectionPublic from PublicPath")
            signer.unlink(CandyNFT.CollectionPublicPath)
        }

    }
}
