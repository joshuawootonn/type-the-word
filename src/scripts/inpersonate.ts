// This is used locally to insert test persona data into my user so I can see the product from their POV

import { createUser } from '~/test-infra/test-utils'

// You have to set this to the relevant `userId`
const userId = 'e7dca35f-95d4-4b5c-a059-68a050d22558'

void createUser({ userId })
