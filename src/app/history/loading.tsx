import { Loading } from '~/components/loading'
import { Tabs, TabsList, TabsTab, TabsPanel } from '~/components/ui/tabs'

export default function HistoryLoading() {
    return (
        <Tabs defaultValue="overview">
            <TabsList className="mb-4">
                <TabsTab value="overview">Overview</TabsTab>
                <TabsTab value="log">Log</TabsTab>
            </TabsList>

            <TabsPanel value="overview">
                <Loading />
            </TabsPanel>

            <TabsPanel value="log">
                <Loading initialDots={3} />
            </TabsPanel>
        </Tabs>
    )
}
