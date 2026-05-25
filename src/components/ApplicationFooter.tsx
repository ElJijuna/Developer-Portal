import { Box, Button, Icon, Text, WrapBox } from "@gnome-ui/react";
import { useFloatyWidgetManager } from 'floaty-widget';
import { FocusWindows } from '@gnome-ui/icons'

export function ApplicationFooter() {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());

  return (
    <WrapBox justify="space-between">
      <Text color="dim" variant="caption">© {new Date().getFullYear()} Developer Portal</Text>
      <Box orientation="horizontal" align="center">
        {widgets.map((widget) => (
          <Button key={widget.id} size="sm" onClick={() => {
            if (widget.isMinimized) {
              manager.restoreWidget(widget.id);
            } else {
              manager.minimizeWidget(widget.id);
            }
          }}>
            <Icon icon={FocusWindows} />
          </Button>
        ))}
      </Box>
      <WrapBox>
        <Button variant="flat" size="sm" disabled>Privacy</Button>
        <Button variant="flat" size="sm" disabled>Terms</Button>
      </WrapBox>
    </WrapBox>
  );
}
