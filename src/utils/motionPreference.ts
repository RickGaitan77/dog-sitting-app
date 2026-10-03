export const REDUCE_MOTION_CHANGE_EVENT = 'dog-sitting:reduce-motion-change'

export function announceReduceMotionChange(reduceMotion: boolean): void {
  window.dispatchEvent(
    new CustomEvent<boolean>(REDUCE_MOTION_CHANGE_EVENT, {
      detail: reduceMotion,
    }),
  )
}
