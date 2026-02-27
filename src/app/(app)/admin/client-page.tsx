"use client"

import { FormEvent, useEffect, useState } from "react"

import { type AdminUserSearchItem } from "~/app/api/admin/users/search/schemas"
import { Button } from "~/components/ui/button"
import {
    Combobox,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
    ComboboxPopup,
    ComboboxPortal,
    ComboboxPositioner,
} from "~/components/ui/combobox"
import { Input } from "~/components/ui/input"
import { Tabs, TabsList, TabsPanel, TabsTab } from "~/components/ui/tabs"

import { deactivateUser, searchUsers } from "./actions"

type FormState = {
    status: "idle" | "success" | "error"
    message: string
}

const DEACTIVATE_CONFIRMATION_TEXT = "DEACTIVATE"

function isAdminUserSearchItem(value: unknown): value is AdminUserSearchItem {
    if (typeof value !== "object" || value === null) {
        return false
    }

    return (
        "id" in value &&
        typeof value.id === "string" &&
        "email" in value &&
        typeof value.email === "string" &&
        "name" in value &&
        (typeof value.name === "string" || value.name === null)
    )
}

function getUserLabel(user: AdminUserSearchItem | null): string {
    if (!user) {
        return ""
    }

    return user.name ? `${user.name} (${user.email})` : user.email
}

export function ClientPage() {
    const [userQuery, setUserQuery] = useState("")
    const [userOptions, setUserOptions] = useState<AdminUserSearchItem[]>([])
    const [selectedUser, setSelectedUser] =
        useState<AdminUserSearchItem | null>(null)
    const [isSearchingUsers, setIsSearchingUsers] = useState(false)
    const [confirmation, setConfirmation] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [state, setState] = useState<FormState>({
        status: "idle",
        message: "",
    })

    useEffect(() => {
        const trimmedQuery = userQuery.trim()
        if (trimmedQuery.length < 2) {
            setUserOptions([])
            setIsSearchingUsers(false)
            return
        }

        const selectedLabel = getUserLabel(selectedUser).trim()
        if (selectedUser && trimmedQuery === selectedLabel) {
            setUserOptions([selectedUser])
            setIsSearchingUsers(false)
            return
        }

        let isCancelled = false
        setIsSearchingUsers(true)

        const timeoutId = window.setTimeout(async () => {
            try {
                const response = await searchUsers(trimmedQuery)
                if (!isCancelled) {
                    if (
                        selectedUser &&
                        response.users.some(
                            user => user.id === selectedUser.id,
                        ) === false
                    ) {
                        setUserOptions([selectedUser, ...response.users])
                    } else {
                        setUserOptions(response.users)
                    }
                }
            } catch (_error) {
                if (!isCancelled) {
                    setUserOptions([])
                }
            } finally {
                if (!isCancelled) {
                    setIsSearchingUsers(false)
                }
            }
        }, 200)

        return () => {
            isCancelled = true
            window.clearTimeout(timeoutId)
        }
    }, [selectedUser, userQuery])

    async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
        event.preventDefault()

        if (!selectedUser) {
            setState({
                status: "error",
                message: "Select a user from the search list first.",
            })
            return
        }

        if (confirmation !== DEACTIVATE_CONFIRMATION_TEXT) {
            setState({
                status: "error",
                message: `Please type ${DEACTIVATE_CONFIRMATION_TEXT} to confirm.`,
            })
            return
        }

        setState({ status: "idle", message: "" })
        setIsSubmitting(true)

        try {
            const result = await deactivateUser(selectedUser.id)
            setState({ status: "success", message: result.message })
            setUserQuery("")
            setUserOptions([])
            setSelectedUser(null)
            setConfirmation("")
        } catch (error) {
            setState({
                status: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to deactivate user.",
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Tabs defaultValue="deactivate-user">
            <TabsList>
                <TabsTab value="deactivate-user">Deactivate User</TabsTab>
            </TabsList>

            <TabsPanel value="deactivate-user">
                <form className="not-prose space-y-6" onSubmit={onSubmit}>
                    <div>
                        <label htmlFor="user-search" className="mb-2 block">
                            Search User (email or name)
                        </label>
                        <Combobox
                            items={userOptions}
                            value={selectedUser}
                            onValueChange={value => {
                                if (isAdminUserSearchItem(value)) {
                                    setSelectedUser(value)
                                } else {
                                    setSelectedUser(null)
                                }
                                setState({ status: "idle", message: "" })
                            }}
                            onInputValueChange={value => {
                                setUserQuery(value)
                                const selectedLabel = getUserLabel(selectedUser)
                                if (selectedUser && value !== selectedLabel) {
                                    setSelectedUser(null)
                                }
                                setState({ status: "idle", message: "" })
                            }}
                            itemToStringLabel={item =>
                                isAdminUserSearchItem(item)
                                    ? getUserLabel(item)
                                    : ""
                            }
                            itemToStringValue={item =>
                                isAdminUserSearchItem(item) ? item.id : ""
                            }
                            isItemEqualToValue={(item, value) =>
                                item.id === value.id
                            }
                            filter={null}
                        >
                            <ComboboxInput
                                id="user-search"
                                placeholder="jane@example.com or Jane"
                                autoComplete="off"
                                required
                            />
                            <ComboboxPortal>
                                <ComboboxPositioner sideOffset={-2}>
                                    <ComboboxPopup>
                                        {isSearchingUsers && (
                                            <div className="px-2 py-1 text-sm">
                                                Searching...
                                            </div>
                                        )}
                                        <ComboboxEmpty>
                                            {userQuery.trim().length < 2
                                                ? "Type at least 2 characters to search."
                                                : "No users found."}
                                        </ComboboxEmpty>
                                        <ComboboxList>
                                            {(item: AdminUserSearchItem) => (
                                                <ComboboxItem
                                                    key={item.id}
                                                    value={item}
                                                >
                                                    <div className="font-semibold">
                                                        {item.name ??
                                                            item.email}
                                                    </div>
                                                    {item.name && (
                                                        <div>{item.email}</div>
                                                    )}
                                                </ComboboxItem>
                                            )}
                                        </ComboboxList>
                                    </ComboboxPopup>
                                </ComboboxPositioner>
                            </ComboboxPortal>
                        </Combobox>
                    </div>

                    {selectedUser && (
                        <div className="border-primary bg-secondary border-2 p-3 text-sm">
                            Selected ID: <code>{selectedUser.id}</code>
                        </div>
                    )}

                    <div>
                        <label
                            htmlFor="deactivate-confirmation"
                            className="mb-2 block"
                        >
                            Type {DEACTIVATE_CONFIRMATION_TEXT} to confirm
                        </label>
                        <Input
                            id="deactivate-confirmation"
                            type="text"
                            value={confirmation}
                            onChange={event =>
                                setConfirmation(event.target.value)
                            }
                            autoComplete="off"
                            required
                        />
                    </div>

                    {state.status === "error" && (
                        <div className="not-prose border-error bg-secondary text-error border-2 p-4 text-sm">
                            {state.message}
                        </div>
                    )}

                    {state.status === "success" && (
                        <div className="not-prose border-success bg-secondary text-success border-2 p-4 text-sm">
                            {state.message}
                        </div>
                    )}

                    <div className="border-primary flex justify-end pt-6">
                        <Button
                            type="submit"
                            isLoading={isSubmitting}
                            loadingLabel="Deactivating user"
                            disabled={!selectedUser}
                        >
                            Deactivate User
                        </Button>
                    </div>
                </form>
            </TabsPanel>
        </Tabs>
    )
}
