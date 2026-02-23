import { createClient } from "@/utils/supabase/client";
import { AppNotification, NotificationCategory } from "@/lib/types";

export const triggerNotification = async (
    userId: string,
    category: NotificationCategory,
    type: string,
    title: string,
    message: string,
    metadata: Record<string, any> = {}
) => {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('app_notifications')
        .insert([
            {
                user_id: userId,
                category,
                type,
                title,
                message,
                metadata,
                is_read: false
            }
        ])
        .select()
        .single();

    if (error) {
        console.error('Error triggering notification:', error);
        return { success: false, error };
    }

    return { success: true, data };
};
