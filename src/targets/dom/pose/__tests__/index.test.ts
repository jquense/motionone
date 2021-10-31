import {
  pointerDown,
  pointerEnter,
  pointerLeave,
} from "../../../../../jest.setup"
import { style } from "../../style"
import { pose } from "../index"
import "../../__tests__/web-animations.min-edited.js"

describe("pose()", () => {
  test("Types are correct", () => {
    const element = document.createElement("div")
    pose(element, {
      hover: "enlarge",
      enlarge: { scale: 2 },
    })
  })

  test("Animate to `style` on mount", async () => {
    const element = document.createElement("div")

    expect(style.get(element, "scale")).toBe(1)

    await new Promise<void>((resolve) => {
      pose(
        element,
        { style: { scale: 2 } },
        { onAnimationComplete: () => resolve() }
      )
    })

    expect(style.get(element, "scale")).toBe("2")
    expect(element).toHaveStyle("transform: scale(var(--motion-scale))")
  })

  test("Default options are used for animation", async () => {
    const element = document.createElement("div")

    const promise = new Promise((resolve, reject) => {
      pose(
        element,
        { style: { opacity: 0.5 } },
        { duration: 0.1, onAnimationComplete: () => resolve(true) }
      )

      setTimeout(reject, 200)
    })

    await expect(promise).resolves.toBe(true)
    expect(element).toHaveStyle("opacity: 0.5")
  })

  test("onAnimationStart fires", async () => {
    const element = document.createElement("div")

    const promise = new Promise((resolve, reject) => {
      pose(
        element,
        { style: { opacity: 0.5 } },
        { duration: 0.1, onAnimationStart: (target) => resolve(target) }
      )

      setTimeout(reject, 200)
    })

    await expect(promise).resolves.toEqual({ opacity: 0.5 })
  })

  test("Pose can accept options override", async () => {
    const element = document.createElement("div")

    expect(style.get(element, "scale")).toBe(1)

    const promise = new Promise((resolve, reject) => {
      pose(
        element,
        { style: { opacity: 1, options: { duration: 0.1 } } },
        { duration: 1, onAnimationComplete: resolve }
      )
      setTimeout(reject, 500)
    })

    expect(promise).resolves
  })

  test("New poses trigger animations if different", async () => {
    const element = document.createElement("div")

    await new Promise((onAnimationComplete) => {
      pose(element, { style: { opacity: 1 } })
      pose(
        element,
        { style: { opacity: 0.5 } },
        { duration: 0.01, onAnimationComplete }
      )
    })

    expect(element).toHaveStyle("opacity: 0.5")
  })

  test("New poses don't trigger animations if the same", async () => {
    const element = document.createElement("div")

    const promise = new Promise((resolve, reject) => {
      pose(element, { style: { opacity: 1 } })
      pose(
        element,
        { style: { opacity: 1 } },
        { duration: 0.01, onAnimationComplete: reject }
      )

      setTimeout(() => resolve(true), 100)
    })

    expect(promise).resolves.toEqual(true)
  })

  test("If value is removed from active pose, animate to initial base target", async () => {
    const element = document.createElement("div")
    element.style.opacity = "0.5"

    await new Promise<void>((resolve, reject) => {
      pose(
        element,
        {
          style: { opacity: 1, scale: 2 },
        },
        {
          duration: 0.01,
          onAnimationComplete: () => {
            expect(element).toHaveStyle("opacity: 1; --motion-scale: 2")
            pose(
              element,
              {},
              { duration: 0.01, onAnimationComplete: () => resolve() }
            )
          },
        }
      )

      setTimeout(reject, 200)
    })

    expect(element).toHaveStyle("opacity: 0.5; --motion-scale: 1")
  })

  test("Animate to hover when hover starts", async () => {
    const element = document.createElement("div")

    await new Promise((resolve) => {
      pose(
        element,
        {
          hover: { opacity: 0.5 },
        },
        {
          duration: 0.01,
          onAnimationComplete: resolve,
        }
      )

      pointerEnter(element)
    })

    expect(element).toHaveStyle("opacity: 0.5")
  })

  test("Animate to new hover pose while hover is active", async () => {
    const element = document.createElement("div")

    await new Promise((resolve) => {
      pose(
        element,
        {
          hover: { opacity: 0.5 },
        },
        { duration: 0.01 }
      )

      pointerEnter(element)

      requestAnimationFrame(() => {
        pose(
          element,
          { hover: { opacity: 0.75 } },
          { duration: 0.01, onAnimationComplete: resolve }
        )
      })
    })

    expect(element).toHaveStyle("opacity: 0.75")
  })

  test("Animate from hover when hover ends", async () => {
    const element = document.createElement("div")
    element.style.opacity = "1"

    await new Promise<void>((resolve) => {
      pose(
        element,
        {
          hover: { opacity: 0.5 },
        },
        {
          duration: 0.01,
          onAnimationComplete: (target) => {
            if (target.opacity === "1") resolve()
          },
        }
      )

      pointerEnter(element)
      setTimeout(() => {
        pointerLeave(element)
      }, 50)
    })

    expect(element).toHaveStyle("opacity: 1")
  })

  test("Animate to press when press starts", async () => {
    const element = document.createElement("div")

    await new Promise((resolve) => {
      pose(
        element,
        {
          pressed: { scale: 0.5 },
          press: "pressed",
        },
        {
          duration: 0.01,
          onAnimationComplete: resolve,
        }
      )

      pointerDown(element)
    })

    expect(element).toHaveStyle("--motion-scale: 0.5")
  })

  test("Animate to new press pose while press is active", async () => {
    const element = document.createElement("div")

    await new Promise((resolve) => {
      pose(
        element,
        {
          press: { opacity: 0.5 },
        },
        { duration: 0.01 }
      )

      pointerDown(element)

      requestAnimationFrame(() => {
        pose(
          element,
          { press: { opacity: 0.75 } },
          { duration: 0.01, onAnimationComplete: resolve }
        )
      })
    })

    expect(element).toHaveStyle("opacity: 0.75")
  })

  test("If hover changes while overridden by press, don't animate", async () => {
    const element = document.createElement("div")

    await new Promise<void>((resolve) => {
      pose(
        element,
        {
          hover: { opacity: 0.5 },
          press: { opacity: 0.75 },
        },
        { duration: 0.01 }
      )

      pointerEnter(element)

      requestAnimationFrame(() => {
        pointerDown(element)
        pose(
          element,
          {
            hover: { opacity: 0.25 },
            press: { opacity: 0.75 },
          },
          { duration: 0.01 }
        )

        setTimeout(() => {
          resolve()
        }, 50)
      })
    })

    expect(element).toHaveStyle("opacity: 0.75")
  })

  // test("Animate from press to hover when press ends", async () => {})

  // test("Animate from press to style when press ends", async () => {})
})
