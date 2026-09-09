import { Box, Button, Icon, Text, WrapBox, Popover } from "@gnome-ui/react";
import { useFloatyWidgetManager, FloatyPreview } from 'floaty-widget';
import { FocusWindows } from '@gnome-ui/icons'
import { useState } from 'react';

export function ApplicationFooter() {
  const manager = useFloatyWidgetManager();
  const widgets = Array.from(manager.widgets.values());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <WrapBox justify="space-between">
      <Text color="dim" variant="caption">© {new Date().getFullYear()} Developer Portal</Text>
      <Box orientation="horizontal" align="center">
        {widgets.map((widget) => (
          <Popover
            key={widget.id}
            placement="top"
            open={hoveredId === widget.id}
            onOpenChange={(open) => !open && setHoveredId(null)}
            content={<FloatyPreview id={widget.id} />}
          >
            <Button
              size="sm"
              onMouseEnter={() => setHoveredId(widget.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => {
                if (widget.isMinimized) {
                  manager.restoreWidget(widget.id);
                } else {
                  manager.minimizeWidget(widget.id);
                }
              }}
            >
              <Icon icon={FocusWindows} />
            </Button>
          </Popover>
        ))}
      </Box>
      <WrapBox>
        <Button variant="flat" size="sm" disabled>Privacy</Button>
        <Button variant="flat" size="sm" disabled>Terms</Button>
      </WrapBox>
    </WrapBox>
  );
}
