import type { TierPlan } from './blueprint'
import { royalSalonSurfacePlan } from './royalSalonView'
import { diningHallSurfacePlan } from './diningHallSurfacePlan'
import { prisonSurfacePlan } from './prisonView'
import { casinoSurfacePlan } from './casinoView'
import { burialSurfacePlan } from './burialChamberView'
import { queenApartmentSurfacePlan } from './queenApartmentView'
import { queenUnmaSurfacePlan } from './queenUnmaView'
import { benjaminSurfacePlan } from './benjaminRoomView'
import { camillaSurfacePlan } from './camillaView'
import { tserriednichSurfacePlan } from './tserriednichRoomView'
import { wobleSurfacePlan } from './wobleView'
import { marayamSurfacePlan } from './marayamView'
import { momozeSurfacePlan } from './momozeView'
import { fugetsuSurfacePlan } from './fugetsuView'
import { kachoSurfacePlan } from './kachoView'
import { halkenburgSurfacePlan } from './halkenburgView'
import { salesaleSurfacePlan } from './salesaleView'
import { luzurusSurfacePlan } from './luzurusView'
import { tysonSurfacePlan } from './tysonView'
import { tubeppaSurfacePlan } from './tubeppaView'
import { zhangLeiSurfacePlan } from './zhangLeiView'
import { princesSurfacePlan } from './princesQuartersView'
import { princeApartmentSurfacePlan } from './princeApartmentEnvelope'
import { heillySurfacePlan } from './heillyHideoutView'
import { justiceSurfacePlan } from './justiceBureauView'
import { policeSurfacePlan } from './policeStationView'
import { chaRSurfacePlan } from './chaROfficeView'
import { hospitalSurfacePlan } from './hospitalView'
import { royalArmyConferenceSurfacePlan } from './royalArmyConferenceView'
import { cineplexSurfacePlan } from './cineplexView'
import { podCabinSurfacePlan } from './podCabinView'
import { supremeCourtSurfacePlan } from './supremeCourtView'
import { screeningRoomSurfacePlan } from './screeningRoomView'
import { hangarEntranceSurfacePlan } from './hangarEntranceView'
import { warehouseSurfacePlan } from './warehouseView'
import { hullSuspensionSurfacePlan } from './hullSuspensionView'
import { room3101SurfacePlan } from './room3101View'
import { sourceBoundInteriorSurfacePlan } from './sourceBoundInteriorView'

export function deckSurfacePlan(plan: TierPlan, reveal: boolean): TierPlan {
  const apartmentPlan = tubeppaSurfacePlan(
    princeApartmentSurfacePlan(
      tserriednichSurfacePlan(
        zhangLeiSurfacePlan(camillaSurfacePlan(prisonSurfacePlan(plan, reveal), reveal), reveal),
        reveal,
      ),
      reveal,
    ),
    reveal,
  )
  const basePlan = wobleSurfacePlan(
    marayamSurfacePlan(
      momozeSurfacePlan(
        fugetsuSurfacePlan(
          kachoSurfacePlan(
            halkenburgSurfacePlan(
              salesaleSurfacePlan(
                luzurusSurfacePlan(tysonSurfacePlan(apartmentPlan, reveal), reveal),
                reveal,
              ),
              reveal,
            ),
            reveal,
          ),
          reveal,
        ),
        reveal,
      ),
      reveal,
    ),
    reveal,
  )
  const surfacePlan = warehouseSurfacePlan(
    hangarEntranceSurfacePlan(
      screeningRoomSurfacePlan(
        supremeCourtSurfacePlan(
          podCabinSurfacePlan(
            cineplexSurfacePlan(
              hospitalSurfacePlan(
                chaRSurfacePlan(
                  policeSurfacePlan(
                    justiceSurfacePlan(
                      heillySurfacePlan(
                        benjaminSurfacePlan(
                          burialSurfacePlan(
                            casinoSurfacePlan(princesSurfacePlan(basePlan, reveal), reveal),
                            reveal,
                          ),
                          reveal,
                        ),
                        reveal,
                      ),
                      reveal,
                    ),
                    reveal,
                  ),
                  reveal,
                ),
                reveal,
              ),
              reveal,
            ),
            reveal,
          ),
          reveal,
        ),
        reveal,
      ),
      reveal,
    ),
    reveal,
  )
  const detailedPlan = sourceBoundInteriorSurfacePlan(
    room3101SurfacePlan(
      hullSuspensionSurfacePlan(
        queenUnmaSurfacePlan(
          queenApartmentSurfacePlan(
            royalArmyConferenceSurfacePlan(
              royalSalonSurfacePlan(diningHallSurfacePlan(surfacePlan, reveal), reveal),
              reveal,
            ),
            reveal,
          ),
          reveal,
        ),
        reveal,
      ),
      reveal,
    ),
    reveal,
  )
  return detailedPlan
}
