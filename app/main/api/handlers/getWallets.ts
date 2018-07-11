import { Contexts, asRuntimeType } from "app/common/runtimeTypes"
import { Wallets } from "app/common/runtimeTypes/storage/wallets"
import { SubSystems } from "app/main/system"

/**
 * Handler function for "getWallets" methods.
 * It retrieves and returns a list of wallet info objects taken from app state.
 * @param system
 * @param params
 */
export default async function getWallets(system: SubSystems, params: any) {
  const _wallets = system.appStateManager.get("wallets")

  return asRuntimeType(_wallets, Wallets, Contexts.STATE)
}