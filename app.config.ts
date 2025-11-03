export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      // Принудительно делаем success таким же, как primary (синим),
      // чтобы кольца/обводки Nuxt UI, использующие success, были синими
      success: 'blue'
    },
    navigationMenu: {
      // Тема NavigationMenu: для случая orientation=horizontal + contentOrientation=vertical
      // убираем фиксированную ширину контента (w-60) и даём ширину по содержимому
      compoundVariants: [
        {
          orientation: 'horizontal',
          contentOrientation: 'vertical',
          class: {
            content: 'w-auto min-w-max',
            viewport: 'w-auto min-w-max'
          }
        }
      ]
    },
    skeleton: {
      base: 'animate-pulse rounded-md bg-slate-200 dark:bg-slate-700'
    },
    input: {
      variants: {
        default: {
          base: 'ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary'
        }
      }
    },
    button: {
      base: 'cursor-pointer'
    }
  }
})


