import NonFungibleToken from "NonFungibleToken"
import CandyNFT from "CandyNFT"

pub fun main(address: Address): Int {
    let account = getAccount(address)

    let collectionRef = account
        .getCapability(CandyNFT.CollectionPublicPath)
        .borrow<&{NonFungibleToken.CollectionPublic}>()
        ?? panic("Could not borrow capability from public collection")

    return collectionRef.getIDs().length
}
