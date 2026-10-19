<?php
namespace App\Service;

class MailService {
    public function send(?int $senderId, string $senderType, ?int $receiverId, string $receiverType, string $content) {
        $db = Database::getConnection();
        $stmt = $db->prepare("INSERT INTO internal_messages (sender_id, sender_type, receiver_id, receiver_type, content) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$senderId, $senderType, $receiverId, $receiverType, $content]);
    }

    public function getThread(int $clientId) {
        $db = Database::getConnection();
        $stmt = $db->prepare("SELECT * FROM internal_messages WHERE (sender_id = ? OR receiver_id = ?) ORDER BY created_at ASC");
        $stmt->execute([$clientId, $clientId]);
        $rows = $stmt->fetchAll();
        // L020: consultation par le client = les messages reçus deviennent lus
        $upd = $db->prepare("UPDATE internal_messages SET is_read = 1 WHERE receiver_id = ? AND receiver_type = 'client' AND is_read = 0");
        $upd->execute([$clientId]);
        return $rows;
    }
}
