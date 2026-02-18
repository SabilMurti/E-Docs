<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SiteInvitationNotification extends Notification
{
    use Queueable;

    protected $site;
    protected $inviter;

    /**
     * Create a new notification instance.
     */
    public function __construct($site, $inviter)
    {
        $this->site = $site;
        $this->inviter = $inviter;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'site_invitation',
            'site_id' => $this->site->id,
            'site_name' => $this->site->name,
            'inviter_name' => $this->inviter->name,
            'message' => "{$this->inviter->name} invited you to collaborate on {$this->site->name}",
            'action_url' => "/sites/{$this->site->id}",
        ];
    }
}
