<?php

namespace App\Mail;

use App\Models\Space;
use App\Models\SpaceMember;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SpaceInvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public Space $space;
    public SpaceMember $member;

    /**
     * Create a new message instance.
     */
    public function __construct(Space $space, SpaceMember $member)
    {
        $this->space = $space;
        $this->member = $member;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Invitation to join ' . $this->space->name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.spaces.invitation',
        );
    }
}
